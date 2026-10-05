/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { ActiveGame, Player, Round } from "../../types";
import { makePhaseGraphGame, phaseGraphPlayers } from "../Standings/phaseGraphTestFixtures";

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

beforeAll(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0, open: false } });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  appUrl = `http://127.0.0.1:${address.port}/scorekeeper/`;
  browser = await webkit.launch();
}, 60_000);

async function bounds(locator: Locator) {
  const value = await locator.boundingBox();
  if (!value) throw new Error("Expected a visible Phases Card element");
  return value;
}

async function setPlayerAvailability(page: Page, player: Player, available: boolean) {
  await page.evaluate(
    ({ player, available }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("phase10-db");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("players", "readwrite");
          const store = tx.objectStore("players");
          if (available) store.put(player);
          else store.delete(player.id);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    { player, available },
  );
}

it("shows pending data as loading rather than confirmed empty phase groups", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await seedGame(page);
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open("phase10-db");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(["players", "rounds"], "readwrite");
            let released = false;
            document.addEventListener(
              "release-phase-data",
              () => {
                released = true;
              },
              { once: true },
            );
            tx.oncomplete = () => db.close();
            function keepLocked() {
              tx.objectStore("players").get("zoe").onsuccess = () => {
                if (!released) keepLocked();
              };
            }
            keepLocked();
            resolve();
          };
        }),
    );
    const card = await openCard(page);
    const list = card.getByRole("region", { name: "Phases Card phase list", exact: true });
    expect(await list.getAttribute("aria-busy")).toBe("true");
    expect(await list.locator("[title]").count()).toBe(0);
    expect(await list.getByRole("group").count()).toBe(0);
    await page.evaluate(() => document.dispatchEvent(new Event("release-phase-data")));
    await expect
      .poll(() => names(card, 1))
      .toEqual(["Zoe Jones", "Alex Stone", "Ada Stone", "Bo Reed"]);
    expect(await list.getAttribute("aria-busy")).toBe("false");
  } finally {
    await page.close();
  }
}, 30_000);

it.each([
  "players",
  "rounds",
] as const)("recovers from unavailable %s without presenting empty groups", async (source) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await seedGame(page);
    if (source === "rounds") {
      await page.evaluate(() => {
        const getAll = IDBIndex.prototype.getAll;
        IDBIndex.prototype.getAll = function (...args) {
          if (this.objectStore.name === "rounds") {
            IDBIndex.prototype.getAll = getAll;
            throw new DOMException("Round data unavailable", "UnknownError");
          }
          return getAll.apply(this, args);
        };
      });
    } else {
      await setPlayerAvailability(page, players[0], false);
    }
    await page.getByRole("button", { name: "Open Phases Card", exact: true }).click();
    const card = page.getByRole("dialog", { name: "Phases Card", exact: true });
    await card.getByText("Unable to load Players' Current Phases.", { exact: true }).waitFor();
    expect(await card.getByRole("group").count()).toBe(0);
    expect(
      await card.getByRole("region", { name: "Phases Card phase list", exact: true }).count(),
    ).toBe(0);
    if (source === "players") {
      await setPlayerAvailability(page, players[0], true);
    }
    await card.getByRole("button", { name: "Try again", exact: true }).click();
    await expect
      .poll(() => names(card, 1))
      .toEqual(["Zoe Jones", "Alex Stone", "Ada Stone", "Bo Reed"]);
  } finally {
    await page.close();
  }
}, 30_000);

it("keeps empty rows compact and occupied stacks below the first line with responsive single-line overflow", async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 844 } });
  try {
    const crowd = Array.from({ length: 26 }, (_, index) => ({
      ...players[index % 4],
      id: `crowd-${index}`,
      name: `Player ${index}`,
    }));
    const solo = { ...players[0], id: "solo", name: "Solo Player" };
    const identities = [...crowd, solo];
    const game = makeGame({
      players: identities.map((player) => player.id),
      activePlayers: identities.map((player) => player.id).reverse(),
    });
    const rounds: Round[] = [
      {
        gameId: game.id,
        scorekeeper: "phase10",
        roundNumber: 1,
        roundWinnerId: solo.id,
        scores: [
          { playerId: solo.id, currentPhase: 1, phaseStatus: "completed", score: 0 },
          ...crowd.map((player) => ({
            playerId: player.id,
            currentPhase: 1,
            phaseStatus: "failed" as const,
            score: 0,
          })),
        ],
      },
    ];
    await seedGame(page, game, identities, rounds);
    const card = await openCard(page);
    await expect.poll(() => names(card, 1)).toEqual(crowd.map((player) => player.name));
    expect(await names(card, 2)).toEqual(["Solo Player"]);
    const visibleAvatars = group(card, 1).locator('span[style*="background-color"]');
    let narrowCount = 0;
    for (const width of [320, 1280, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: width === 1280 ? "dark" : "light" });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await expect
        .poll(async () => {
          const groupBounds = await bounds(group(card, 1));
          return (
            (await bounds(group(card, 1).getByText(/^\+\d+$/))).x <
            groupBounds.x + groupBounds.width
          );
        })
        .toBe(true);
      const count = await visibleAvatars.count();
      expect(
        await group(card, 1)
          .getByText(/^\+\d+$/)
          .innerText(),
      ).toBe(`+${26 - count}`);
      if (width === 320) {
        if (narrowCount) expect(count).toBe(narrowCount);
        narrowCount = count;
      } else if (width === 1280) {
        expect(count).toBeGreaterThan(narrowCount);
      }
      const avatarBoxes = await visibleAvatars.evaluateAll((avatars) =>
        avatars.map((avatar) => {
          const rect = avatar.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }),
      );
      expect(avatarBoxes.length).toBeGreaterThan(1);
      for (const [index, avatar] of avatarBoxes.entries()) {
        expect(avatar.y).toBeCloseTo(avatarBoxes[0].y, 1);
        expect(avatar.width).toBe(26);
        expect(avatar.height).toBe(26);
        if (index) {
          expect(avatar.x).toBeGreaterThan(avatarBoxes[index - 1].x);
          expect(avatar.x).toBeLessThan(avatarBoxes[index - 1].x + 26);
        }
      }
      const chip = await bounds(group(card, 1).getByText(/^\+\d+$/));
      const stack = await bounds(group(card, 1));
      expect(chip.y).toBeCloseTo(avatarBoxes[0].y, 1);
      expect(chip.x + chip.width).toBeLessThanOrEqual(stack.x + stack.width + 1);
      expect(stack.height).toBe(26);
      expect(await bounds(group(card, 2))).toMatchObject({ height: 26 });
      expect(
        await group(card, 2)
          .getByText(/^\+\d+$/)
          .count(),
      ).toBe(0);

      const rows = card.locator(".list-row-shell");
      for (const index of [0, 1]) {
        const row = rows.nth(index);
        const number = await bounds(row.getByText(String(index + 1), { exact: true }));
        const description = await bounds(row.locator("[title]"));
        const avatars = await bounds(group(card, index + 1));
        expect(number.y + number.height / 2).toBeCloseTo(description.y + description.height / 2, 1);
        expect(avatars.y).toBeGreaterThanOrEqual(description.y + description.height);
        expect(avatars.x).toBe(description.x);
        expect(avatars.x).toBeGreaterThan(number.x + number.width);
      }
      for (const index of [2, 3]) {
        expect((await bounds(rows.nth(index))).height).toBe(41);
        expect(await rows.nth(index).getByRole("group").count()).toBe(0);
      }
      expect(await rows.getByRole("button").count()).toBe(0);
      expect(await rows.locator("[tabindex]").count()).toBe(0);
      expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    }

    await closeDialog(page, card);
    await page.getByRole("link", { name: "Go home", exact: true }).click();
    const gameLink = page.getByRole("link", { name: /^Continue game with/ });
    await gameLink.waitFor();
    expect(await gameLink.getByText(/^\+\d+$/).count()).toBe(1);
    expect(await gameLink.getByRole("button").count()).toBe(0);
    const gameAvatarBoxes = await gameLink
      .locator('span[style*="background-color"]')
      .evaluateAll((avatars) =>
        avatars.map((avatar) => {
          const rect = avatar.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width };
        }),
      );
    expect(gameAvatarBoxes.length).toBeGreaterThan(1);
    expect(gameAvatarBoxes[1].y).toBe(gameAvatarBoxes[0].y);
    expect(gameAvatarBoxes[1].x).toBeLessThan(gameAvatarBoxes[0].x + gameAvatarBoxes[0].width);
  } finally {
    await page.close();
  }
}, 60_000);

it("shares only ordered objectives and keeps standalone and shared Phases Cards Player-free", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await seedGame(page);
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: (text: string) => {
            document.documentElement.dataset.copiedText = text;
            return Promise.resolve();
          },
        },
      });
    });
    const card = await openCard(page);
    await group(card, 1).waitFor();
    await card.getByRole("button", { name: "Share Phases Card", exact: true }).click();
    await card.getByRole("button", { name: "Phases Card link copied", exact: true }).waitFor();
    const url = await page.evaluate(() => document.documentElement.dataset.copiedText);
    if (!url) throw new Error("Expected a copied Phases Card URL");
    expect(url.startsWith(`${appUrl}#/phaseCompan10n/phasescard/custom?data=`)).toBe(true);
    const data = new URLSearchParams(url.split("?")[1]).get("data");
    if (!data) throw new Error("Expected a self-contained Phases Card payload");
    expect(JSON.parse(Buffer.from(data, "base64url").toString())).toEqual({
      v: 1,
      name: "Repeated objectives",
      phases: [
        { requirements: [{ type: "set", count: 3, isSameColor: false, quantity: 2 }] },
        { requirements: [{ type: "set", count: 3, isSameColor: false, quantity: 2 }] },
        {
          requirements: [
            { type: "set", count: 3, isSameColor: false, quantity: 1 },
            { type: "run", count: 4, isSameColor: false, quantity: 1 },
          ],
        },
        {
          requirements: [
            { type: "set", count: 4, isSameColor: false, quantity: 1 },
            { type: "run", count: 4, isSameColor: false, quantity: 1 },
          ],
        },
      ],
    });
    await closeDialog(page, card);
    for (const destination of [url, `${appUrl}#/phaseCompan10n/phasescard/original`]) {
      await page.goto(destination);
      const list = page.getByRole("region", { name: "Phases Card phase list", exact: true });
      await list.locator("[title]").first().waitFor();
      expect(await list.getByRole("group").count()).toBe(0);
      expect(await list.locator('span[style*="background-color"]').count()).toBe(0);
      expect(await list.getByRole("button").count()).toBe(0);
      for (const [index, row] of (await list.locator(".list-row-shell").all()).entries()) {
        expect((await bounds(row)).height).toBe(index === 0 ? 40 : 41);
      }
    }
  } finally {
    await page.close();
  }
}, 30_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const players: Player[] = [
  { ...phaseGraphPlayers.amy, id: "zoe", name: "Zoe Jones" },
  { ...phaseGraphPlayers.bob, id: "alex", name: "Alex Stone" },
  { ...phaseGraphPlayers.cam, id: "ada", name: "Ada Stone" },
  { ...phaseGraphPlayers.amy, id: "bo", name: "Bo Reed", color: "#123456" },
  { ...phaseGraphPlayers.bob, id: "removed", name: "Removed Player" },
];

function makeGame(overrides: Partial<ActiveGame> = {}) {
  return makePhaseGraphGame({
    players: players.map((player) => player.id),
    activePlayers: ["bo", "ada", "alex", "zoe"],
    phaseSet: {
      id: "repeated-phases",
      type: "temporary",
      name: "Repeated objectives",
      phases: ["classic-1", "classic-1", "classic-2", "classic-3"],
    },
    settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 0 },
    ...overrides,
  });
}

async function seedGame(page: Page, game = makeGame(), identities = players, rounds: Round[] = []) {
  page.setDefaultTimeout(5_000);
  page.setDefaultNavigationTimeout(30_000);
  await page.goto(`${appUrl}#/phaseCompan10n/players`);
  await page.getByText("No players yet", { exact: true }).waitFor();
  await page.evaluate(
    ({ game, identities, rounds }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("phase10-db");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(["games", "players", "rounds"], "readwrite");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
          tx.objectStore("games").put(game);
          for (const player of identities) tx.objectStore("players").put(player);
          for (const round of rounds) tx.objectStore("rounds").put(round);
        };
      }),
    { game, identities, rounds },
  );
  await page.goto(`${appUrl}#/phaseCompan10n/game/${game.id}`);
  await page.getByRole("region", { name: "Scoreboard", exact: true }).waitFor();
}

async function openCard(page: Page) {
  await page.getByRole("button", { name: "Open Phases Card", exact: true }).click();
  const card = page.getByRole("dialog", { name: "Phases Card", exact: true });
  await card.getByRole("region", { name: "Phases Card phase list", exact: true }).waitFor();
  await card.evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)),
  );
  return card;
}

function group(card: Locator, phase: number) {
  return card.getByRole("group", { name: `Players on Phase ${phase}`, exact: true });
}

function names(card: Locator, phase: number) {
  return group(card, phase).getByRole("listitem").allTextContents();
}

async function closeDialog(page: Page, dialog: Locator) {
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
}

async function enterRound(
  page: Page,
  winner: string,
  outcomes: { name: string; result: "Failed" | "Passed" | "Skipped" | "Sat Out" }[],
) {
  await page.getByRole("button", { name: /^Add round/ }).click();
  const entry = page.getByRole("dialog");
  await entry.getByRole("button", { name: /Round Winner/ }).click();
  await page.getByRole("option", { name: winner, exact: true }).click();
  for (const { name, result } of outcomes) {
    await entry.getByRole("tab", { name, exact: true }).click();
    const panel = entry.getByRole("tabpanel", { name, exact: true });
    if (result === "Skipped" || result === "Sat Out") {
      const extra = panel.getByRole("button", { name: "Show extra options", exact: true });
      if (await extra.count()) await extra.click();
    }
    await panel.getByRole("button", { name: result, exact: true }).click();
  }
  return entry;
}

it("shows only Active Players at their initial Current Phase in Game Creation Order", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await seedGame(page);
    const card = await openCard(page);
    await expect
      .poll(() => names(card, 1))
      .toEqual(["Zoe Jones", "Alex Stone", "Ada Stone", "Bo Reed"]);
    expect(await card.getByRole("group").count()).toBe(1);
    expect(
      await group(card, 1).locator('span[style*="background-color"]').allTextContents(),
    ).toEqual(["ZJ", "AS", "AS", "BR"]);
    expect(await card.getByText("Removed Player", { exact: true }).count()).toBe(0);
  } finally {
    await page.close();
  }
}, 30_000);

it("moves Players only after saving, using numbered Phases, Round Skip and Sit Out without reordering", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await seedGame(page);
    let card = await openCard(page);
    await expect
      .poll(() => names(card, 1))
      .toEqual(["Zoe Jones", "Alex Stone", "Ada Stone", "Bo Reed"]);
    await closeDialog(page, card);

    const entry = await enterRound(page, "Alex Stone", [
      { name: "Zoe Jones", result: "Skipped" },
      { name: "Ada Stone", result: "Failed" },
      { name: "Bo Reed", result: "Sat Out" },
    ]);
    await entry.getByRole("button", { name: "Cancel", exact: true }).click();
    await entry.waitFor({ state: "detached" });
    card = await openCard(page);
    expect(await names(card, 1)).toEqual(["Zoe Jones", "Alex Stone", "Ada Stone", "Bo Reed"]);
    expect(await card.getByRole("group").count()).toBe(1);
    await closeDialog(page, card);

    await page.getByRole("button", { name: "Add round 1", exact: true }).click();
    await entry.getByRole("button", { name: "Save round", exact: true }).click();
    await entry.waitFor({ state: "detached" });
    card = await openCard(page);
    await expect.poll(() => names(card, 1)).toEqual(["Ada Stone", "Bo Reed"]);
    expect(await names(card, 2)).toEqual(["Zoe Jones", "Alex Stone"]);
    expect(await card.getByRole("group").count()).toBe(2);
    await closeDialog(page, card);

    const nextEntry = await enterRound(page, "Ada Stone", [
      { name: "Zoe Jones", result: "Failed" },
      { name: "Alex Stone", result: "Sat Out" },
      { name: "Bo Reed", result: "Skipped" },
    ]);
    await nextEntry.getByRole("button", { name: "Save round", exact: true }).click();
    await nextEntry.waitFor({ state: "detached" });
    card = await openCard(page);
    await expect
      .poll(() => names(card, 2))
      .toEqual(["Zoe Jones", "Alex Stone", "Ada Stone", "Bo Reed"]);
    expect(await card.getByRole("group").count()).toBe(1);
    expect(await card.getByText("Removed Player", { exact: true }).count()).toBe(0);
  } finally {
    await page.close();
  }
}, 60_000);
