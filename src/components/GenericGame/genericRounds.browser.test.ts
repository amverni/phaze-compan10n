/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

beforeAll(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0, open: false } });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  appUrl = `http://127.0.0.1:${address.port}/phase-10-scoreboard/`;
  browser = await webkit.launch();
}, 60_000);

it("rejects unfinished, malformed, and overflowing entries without losing the draft or saving a partial Round", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await openGame(page, ["Maya"]);
    await saveRound(page, { Maya: "9007199254740991" });
    await page.getByRole("button", { name: "Add Round", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
    const field = dialog.getByRole("button", { name: "Maya Points", exact: true });
    const save = dialog.getByRole("button", { name: "Save", exact: true });
    for (const value of ["-", "1.5", "1e2", "9007199254740992"]) {
      await field.focus();
      await page.keyboard.press("Delete");
      await page.keyboard.type(value);
      expect(await field.getAttribute("aria-invalid")).toBe("true");
      expect(await save.isDisabled()).toBe(true);
      expect(await dialog.getByRole("alert").count()).toBeGreaterThan(0);
    }
    await field.focus();
    await page.keyboard.press("Delete");
    await page.keyboard.type("1");
    await save.click();
    await dialog
      .getByRole("alert")
      .filter({ hasText: /total|range|exact/i })
      .waitFor();
    expect(await field.innerText()).toContain("1");
    expect(await save.isEnabled()).toBe(true);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    expect(await page.getByRole("button", { name: "Expand Round 2", exact: true }).count()).toBe(0);
    await page.reload();
    await page
      .getByRole("cell", { name: "Maya, Round 1: 9007199254740991 Points", exact: true })
      .waitFor();
    expect(await page.getByRole("button", { name: "Expand Round 2", exact: true }).count()).toBe(0);
  } finally {
    await page.close();
  }
}, 60_000);

it("discards unsaved entries on leaving or reloading the scoreboard and restores focus on close", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await openGame(page, ["Maya"]);
    // API seeding bypasses Query invalidation; discard the home's cached empty game list.
    await page.reload();
    const add = page.getByRole("button", { name: "Add Round", exact: true });
    const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
    const standingsButton = await page
      .getByRole("button", { name: "Open Standings", exact: true })
      .boundingBox();
    await add.click();
    expect(await dialog.getAttribute("aria-modal")).toBe("true");
    await page.evaluate(() =>
      Promise.allSettled(document.getAnimations().map((animation) => animation.finished)),
    );
    if (!standingsButton) throw new Error("Missing Standings control");
    expect(
      await page.evaluate(
        ({ x, y, width, height }) =>
          !!document.elementFromPoint(x + width / 2, y + height / 2)?.closest('[role="dialog"]'),
        standingsButton,
      ),
    ).toBe(true);
    await dialog.getByRole("button", { name: "Maya Points", exact: true }).focus();
    // macOS WebKit needs Option-Tab to include buttons when full keyboard access is off.
    const tab = process.platform === "darwin" ? "Alt+Tab" : "Tab";
    for (const key of [tab, `Shift+${tab}`]) {
      for (let index = 0; index < 18; index++) {
        await page.keyboard.press(key);
        await expect
          .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
          .toBe(true);
      }
    }
    await dialog.getByRole("button", { name: "8", exact: true }).click();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await expect
      .poll(() => add.evaluate((element) => element === document.activeElement))
      .toBe(true);
    await page.getByRole("link", { name: "Go home", exact: true }).click();
    await page.getByRole("link", { name: "Continue game with Maya", exact: true }).click();
    await add.click();
    expect(
      await dialog.getByRole("button", { name: "Maya Points", exact: true }).innerText(),
    ).toContain("Not entered");
    await dialog.getByRole("button", { name: "7", exact: true }).click();
    await page.reload();
    await add.click();
    expect(
      await dialog.getByRole("button", { name: "Maya Points", exact: true }).innerText(),
    ).toContain("Not entered");
    expect(await dialog.getByRole("button", { name: "Save", exact: true }).isDisabled()).toBe(true);
  } finally {
    await page.close();
  }
}, 60_000);

async function swipeLeft(panel: Locator) {
  await panel.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const y = bounds.y + 40;
    const startX = bounds.x + bounds.width - 30;
    const endX = bounds.x + 20;
    const touch = (clientX: number) => ({
      identifier: 1,
      target: element,
      clientX,
      clientY: y,
    });
    for (const [type, x] of [
      ["touchstart", startX],
      ["touchmove", endX],
      ["touchend", endX],
    ] as const) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperties(event, {
        touches: { value: type === "touchend" ? [] : [touch(x)] },
        changedTouches: { value: [touch(x)] },
      });
      element.dispatchEvent(event);
    }
  });
}

it.each([
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
])("keeps circular keypad growth, swipe/tabs, sticky cells, and Save reachable at $width x $height", async (viewport) => {
  const page = await browser.newPage({ viewport, hasTouch: true });
  try {
    const names = ["Maya", "Rowan", "Lee", "Alexandria", "Christopher"];
    const gameId = await openGame(page, names);
    await page.getByRole("button", { name: "Add Round", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
    await page.evaluate(() =>
      Promise.allSettled(document.getAnimations().map((animation) => animation.finished)),
    );
    expect(
      await dialog
        .getByText("Keypad enters Points. Tap a field to switch.", { exact: true })
        .count(),
    ).toBe(0);
    expect(
      await dialog
        .getByText("Whole numbers, including zero and negatives.", { exact: true })
        .count(),
    ).toBe(0);
    expect(await dialog.locator("input,textarea").count()).toBe(0);
    const scroll = dialog.locator("[data-swipe-navigation-root]");
    for (const name of ["1", "3", "Change sign", "Backspace"]) {
      await scroll.evaluate(
        (element, bottom) => {
          element.scrollTop = bottom ? element.scrollHeight : 0;
        },
        name === "Change sign" || name === "Backspace",
      );
      const key = dialog.getByRole("button", { name, exact: true });
      const before = await key.boundingBox();
      if (!before) throw new Error("Missing keypad button");
      expect(before.width).toBeGreaterThanOrEqual(44);
      expect(Math.abs(before.width - before.height)).toBeLessThan(1);
      await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
      await page.mouse.down();
      await expect
        .poll(async () => (await key.boundingBox())?.width ?? 0)
        .toBeGreaterThan(before.width + 1);
      const pressed = await key.boundingBox();
      const bounds = await scroll.boundingBox();
      if (!pressed || !bounds) throw new Error("Missing pressed keypad geometry");
      expect(pressed.x).toBeGreaterThan(bounds.x);
      expect(pressed.x + pressed.width).toBeLessThan(bounds.x + bounds.width);
      expect(pressed.y).toBeGreaterThanOrEqual(bounds.y);
      expect(pressed.y + pressed.height).toBeLessThan(bounds.y + bounds.height - 10);
      await page.mouse.up();
    }
    await scroll.evaluate((element) => {
      element.scrollTop = 0;
    });
    await swipeLeft(dialog.getByRole("tabpanel", { name: "Maya", exact: true }));
    await expect
      .poll(() =>
        dialog.getByRole("tab", { name: "Rowan", exact: true }).getAttribute("aria-selected"),
      )
      .toBe("true");
    await dialog.getByRole("tab", { name: "Rowan", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    expect(
      await dialog.getByRole("tab", { name: "Lee", exact: true }).getAttribute("aria-selected"),
    ).toBe("true");
    for (const name of names) {
      await dialog.getByRole("tab", { name, exact: true }).click();
      await dialog.getByRole("button", { name: `${name} Points`, exact: true }).focus();
      await page.keyboard.press("Delete");
      await page.keyboard.type("0");
    }
    const save = dialog.getByRole("button", { name: "Save", exact: true });
    const saveBounds = await save.boundingBox();
    if (!saveBounds) throw new Error("Missing Save button");
    expect(saveBounds.y + saveBounds.height).toBeLessThan(viewport.height);
    expect(saveBounds.x + saveBounds.width).toBeLessThan(viewport.width);
    await save.click();
    await dialog.waitFor({ state: "hidden" });
    await page.evaluate(`(async () => {
        const { genericGamesApi } = await import("/phase-10-scoreboard/src/data/api/genericGames.ts");
        const { genericRoundsApi } = await import("/phase-10-scoreboard/src/data/api/genericRounds.ts");
        const game = await genericGamesApi.getById(${JSON.stringify(gameId)});
        for (let index = 0; index < 22; index++) {
          await genericRoundsApi.add({ gameId: game.id, scores: game.players.map(playerId => ({ playerId, points: "1" })) });
        }
      })()`);
    await page.reload();
    const scoreboard = page.getByRole("region", { name: "Scoreboard", exact: true });
    await scoreboard.waitFor();
    const header = page.getByRole("columnheader").first();
    const initialHeader = await header.boundingBox();
    await scoreboard.evaluate((element) => {
      element.scrollLeft = 200;
      element.scrollTop = 400;
    });
    const stickyHeader = await header.boundingBox();
    const bounds = await scoreboard.boundingBox();
    const roundColumn = await page.getByRole("rowheader").nth(8).boundingBox();
    if (!initialHeader || !stickyHeader || !bounds || !roundColumn)
      throw new Error("Missing scoreboard geometry");
    expect(Math.abs(stickyHeader.y - initialHeader.y)).toBeLessThan(1);
    expect(Math.abs(stickyHeader.x - initialHeader.x)).toBeLessThan(1);
    expect(Math.abs(roundColumn.x - initialHeader.x)).toBeLessThan(1);
    expect(await scoreboard.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    if (viewport.width < 768) {
      expect(await scoreboard.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
    expect(await page.locator("body").evaluate((element) => element.scrollWidth)).toBe(
      viewport.width,
    );
  } finally {
    await page.close();
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function openGame(page: Page, names = ["Maya", "Rowan"]) {
  await page.goto(appUrl);
  const gameId = await page.evaluate<string>(`(async () => {
    const { playersApi } = await import("/phase-10-scoreboard/src/data/api/players.ts");
    const { genericGamesApi } = await import("/phase-10-scoreboard/src/data/api/genericGames.ts");
    const players = [];
    for (const name of ${JSON.stringify(names)}) {
      players.push(await playersApi.create({ name, color: "Jam", isFavorite: 0 }));
    }
    const game = await genericGamesApi.create({
      players: players.map((player) => player.id),
      settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
    });
    return game.id;
  })()`);
  await page.goto(`${appUrl}#/game/${gameId}`);
  await page.getByRole("table", { name: "Points scoreboard" }).waitFor();
  return gameId;
}

async function saveRound(page: Page, scores: Record<string, string>) {
  await page.getByRole("button", { name: "Add Round", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
  for (const [name, points] of Object.entries(scores)) {
    await dialog.getByRole("tab", { name, exact: true }).click();
    await dialog.getByRole("button", { name: `${name} Points`, exact: true }).focus();
    await page.keyboard.type(points);
  }
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await page.locator('[role="dialog"]').waitFor({ state: "detached" });
}

it("keeps a modal Points draft on close, saves explicit zero and negatives, and clears after save", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    await openGame(page);
    const add = page.getByRole("button", { name: "Add Round", exact: true });
    expect(await add.count()).toBe(1);
    await add.click();
    const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
    const save = dialog.getByRole("button", { name: "Save", exact: true });
    expect(await save.isDisabled()).toBe(true);
    expect(await dialog.locator("input, textarea, [contenteditable=true]").count()).toBe(0);
    await dialog.getByRole("button", { name: "0", exact: true }).tap();
    expect(
      await dialog.getByRole("tab", { name: "Maya", exact: true }).getAttribute("aria-describedby"),
    ).toBeTruthy();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await add.click();
    expect(
      await dialog.getByRole("button", { name: "Maya Points", exact: true }).innerText(),
    ).toContain("0");
    await dialog.getByRole("tab", { name: "Rowan", exact: true }).click();
    await dialog.getByRole("button", { name: "Rowan Points", exact: true }).focus();
    await page.keyboard.type("-12");
    await page.keyboard.press("Backspace");
    expect(
      await dialog.getByRole("button", { name: "Rowan Points", exact: true }).innerText(),
    ).toContain("-1");
    expect(await save.isEnabled()).toBe(true);
    await save.click();
    await dialog.waitFor({ state: "hidden" });
    await expect
      .poll(() => page.getByRole("cell", { name: "Maya, Round 1: 0 Points", exact: true }).count())
      .toBe(1);
    expect(
      await page.getByRole("cell", { name: "Rowan, Round 1: -1 Points", exact: true }).count(),
    ).toBe(1);
    await add.click();
    expect(await save.isDisabled()).toBe(true);
    expect(
      await dialog.getByRole("button", { name: "Maya Points", exact: true }).innerText(),
    ).toContain("Not entered");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.reload();
    await page.getByRole("cell", { name: "Rowan, Round 1: -1 Points", exact: true }).waitFor();
  } finally {
    await page.close();
  }
}, 60_000);

it("shows cumulative headers, read-only Round expansion, and shared competition places without changing columns", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await openGame(page, ["Maya", "Rowan", "Lee"]);
    expect(await page.getByRole("button", { name: "Open Standings", exact: true }).count()).toBe(1);
    await saveRound(page, { Maya: "-10", Rowan: "0", Lee: "5" });
    await saveRound(page, { Maya: "15", Rowan: "-2", Lee: "0" });
    const headers = page.getByRole("columnheader");
    expect(await headers.nth(1).innerText()).toContain("Maya");
    expect(await headers.nth(2).innerText()).toContain("Rowan");
    expect(await headers.nth(3).innerText()).toContain("Lee");
    expect(await headers.nth(1).innerText()).toContain("Total Points: 5");
    expect(await headers.nth(2).innerText()).toContain("Total Points: -2");
    await page.getByRole("button", { name: "Expand Round 1", exact: true }).click();
    expect(
      await page.getByRole("cell", { name: "Maya, Round 1: -10 Points", exact: true }).innerText(),
    ).toContain("Accumulated Points: -10");
    expect(await page.getByRole("button", { name: /Edit|Delete/ }).count()).toBe(0);
    await page.getByRole("button", { name: "Open Standings", exact: true }).click();
    const standings = page.getByRole("dialog", { name: "Standings", exact: true });
    const rows = standings.getByRole("listitem");
    expect(await rows.allTextContents()).toEqual([
      expect.stringContaining("Place 1"),
      expect.stringContaining("Place 1"),
      expect.stringContaining("Place 3"),
    ]);
    expect(await rows.nth(0).innerText()).toContain("Maya");
    expect(await rows.nth(1).innerText()).toContain("Lee");
    expect(await rows.nth(2).innerText()).toContain("Rowan");
    expect(await standings.getByText(/Winner|Phases|Tiebreaker|Graph/).count()).toBe(0);
    await standings.getByRole("button", { name: "Close", exact: true }).click();
    await standings.waitFor({ state: "hidden" });
  } finally {
    await page.close();
  }
}, 60_000);
