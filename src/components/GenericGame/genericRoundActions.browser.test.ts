/// <reference types="node" />

import type { Browser } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { GenericGameSettings } from "../../types";

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

it("replaces Save with a reduced-motion-aware spinner while retaining a failed draft for retry", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(`${appUrl}#/scorekeeper`);
    const gameId = await page.evaluate<string>(`(async () => {
      const { playersApi } = await import("/scorekeeper/src/data/api/players.ts");
      const { genericGamesApi } = await import("/scorekeeper/src/data/api/genericGames.ts");
      const player = await playersApi.create({ name: "Maya", color: "Jam", isFavorite: 0 });
      return (await genericGamesApi.create({
        players: [player.id],
        settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
      })).id;
    })()`);
    await page.goto(`${appUrl}#/scorekeeper/game/${gameId}`);
    const add = page.getByRole("button", { name: "Add Round", exact: true });
    await add.click();
    const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    const save = dialog.getByRole("button", { name: "Save", exact: true });
    await dialog.getByRole("button", { name: "7", exact: true }).click();

    // Hold real storage at the IndexedDB boundary, without replacing the save lifecycle.
    await page.evaluate(
      (id) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open("phase10-db");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction("games", "readwrite");
            let locked = true;
            window.addEventListener(
              "release-round-storage",
              () => {
                locked = false;
              },
              { once: true },
            );
            transaction.oncomplete = () => db.close();
            transaction.onabort = () => {
              db.close();
              reject(transaction.error);
            };
            const hold = () => {
              if (locked) transaction.objectStore("games").get(id).onsuccess = hold;
            };
            hold();
            resolve();
          };
        }),
      gameId,
    );
    await page.evaluate(() => {
      const add = IDBObjectStore.prototype.add;
      IDBObjectStore.prototype.add = function (value, key) {
        if (this.name === "rounds") {
          IDBObjectStore.prototype.add = add;
          throw new DOMException("Round storage unavailable", "QuotaExceededError");
        }
        return add.call(this, value, key);
      };
    });
    await save.click();
    const spinner = save.locator("svg[aria-hidden=true]");
    await expect.poll(() => save.isDisabled()).toBe(true);
    expect(await close.isDisabled()).toBe(true);
    expect(await save.innerText()).toBe("");
    expect(await save.locator("svg.lucide-check").count()).toBe(0);
    expect(await spinner.count()).toBe(1);
    expect(await spinner.evaluate((element) => getComputedStyle(element).animationName)).not.toBe(
      "none",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() => spinner.evaluate((element) => getComputedStyle(element).animationName))
      .toBe("none");
    await page.keyboard.press("Escape");
    expect(await save.isVisible()).toBe(true);
    expect(await save.isDisabled()).toBe(true);

    await page.evaluate(() => window.dispatchEvent(new Event("release-round-storage")));
    await dialog.getByRole("alert").filter({ hasText: "Round storage unavailable" }).waitFor();
    expect(await dialog.locator("output").first().innerText()).toBe("7");
    expect(await save.isEnabled()).toBe(true);
    expect(await close.isEnabled()).toBe(true);
    expect(await save.locator("svg.lucide-check").count()).toBe(1);
    await save.click();
    await dialog.waitFor({ state: "detached" });
    await page.getByRole("cell", { name: "Maya, Round 1: 7 Points", exact: true }).waitFor();
    expect(await page.getByRole("button", { name: "Expand Round 2", exact: true }).count()).toBe(0);
    await add.click();
    expect(await dialog.locator("output").first().innerText()).toBe("0");
  } finally {
    await page.close();
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const settings: GenericGameSettings[] = [
  { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
  { mode: "points", pointsDirection: "high", tiebreaker: { direction: "low" }, dealer: false },
  { mode: "singleRoundWinner", tiebreaker: null, dealer: false },
  { mode: "passFail", tiebreaker: null, dealer: false },
];

it.each([
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
])("provides accessible circular Close/Save actions in every mode at $width x $height", async (viewport) => {
  const page = await browser.newPage({ viewport });
  try {
    await page.goto(`${appUrl}#/scorekeeper`);
    const gameIds = await page.evaluate<string[]>(`(async () => {
      const { playersApi } = await import("/scorekeeper/src/data/api/players.ts");
      const { genericGamesApi } = await import("/scorekeeper/src/data/api/genericGames.ts");
      const player = await playersApi.create({ name: "Maya", color: "Jam", isFavorite: 0 });
      const ids = [];
      for (const settings of ${JSON.stringify(settings)}) {
        const game = await genericGamesApi.create({ players: [player.id], settings });
        ids.push(game.id);
      }
      return ids;
    })()`);

    for (const [index, gameId] of gameIds.entries()) {
      await page.goto(`${appUrl}#/scorekeeper/game/${gameId}`);
      const add = page.getByRole("button", { name: "Add Round", exact: true });
      await add.click();
      const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
      const close = dialog.getByRole("button", { name: "Close", exact: true });
      const save = dialog.getByRole("button", { name: "Save", exact: true });
      await save.waitFor();
      expect(await close.innerText()).toBe("");
      expect(await save.innerText()).toBe("");
      expect(await close.locator("svg.lucide-x[aria-hidden=true]").count()).toBe(1);
      expect(await save.locator("svg.lucide-check[aria-hidden=true]").count()).toBe(1);
      for (const colorScheme of ["light", "dark"] as const) {
        await page.emulateMedia({ colorScheme });
        const closeColor = await close
          .locator("svg")
          .evaluate((element) => getComputedStyle(element).color);
        await expect
          .poll(() => save.locator("svg").evaluate((element) => getComputedStyle(element).color))
          .toBe(closeColor);
      }
      await page.emulateMedia({ colorScheme: "light" });

      const mode = settings[index].mode;
      if (mode === "singleRoundWinner") {
        expect(await save.isDisabled()).toBe(true);
        await dialog.getByText("0/1 winner selected", { exact: true }).waitFor();
        await dialog.getByRole("radio", { name: "Maya", exact: true }).click();
      } else if (mode === "passFail") {
        await dialog.getByRole("button", { name: "Maya", exact: true }).click();
      } else {
        await dialog.getByRole("button", { name: "7", exact: true }).click();
      }
      expect(await save.isEnabled()).toBe(true);
      await page.evaluate(() =>
        Promise.allSettled(document.getAnimations().map((animation) => animation.finished)),
      );

      for (const action of [close, save]) {
        const before = await action.boundingBox();
        if (!before) throw new Error("Missing footer action");
        expect(before.width).toBeGreaterThanOrEqual(44);
        expect(Math.abs(before.width - before.height)).toBeLessThan(1);
        expect(
          await action.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).borderRadius),
          ),
        ).toBeGreaterThanOrEqual(before.width / 2);
        await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
        await page.mouse.down();
        await expect
          .poll(async () => (await action.boundingBox())?.width ?? 0)
          .toBeGreaterThan(before.width + 1);
        const pressed = await action.boundingBox();
        const content = await dialog.locator(".dialog-content").boundingBox();
        if (!pressed || !content) throw new Error("Missing footer press geometry");
        expect(pressed.x).toBeGreaterThan(content.x);
        expect(pressed.x + pressed.width).toBeLessThan(content.x + content.width);
        expect(pressed.y).toBeGreaterThan(content.y);
        expect(pressed.y + pressed.height).toBeLessThan(content.y + content.height);
        await page.mouse.move(0, 0);
        await page.mouse.up();
      }
      const closeBounds = await close.boundingBox();
      const saveBounds = await save.boundingBox();
      if (!closeBounds || !saveBounds) throw new Error("Missing footer positions");
      expect(closeBounds.x + closeBounds.width).toBeLessThan(saveBounds.x);

      await close.focus();
      // macOS WebKit requires Option-Tab to include buttons without full keyboard access.
      await page.keyboard.press(process.platform === "darwin" ? "Alt+Tab" : "Tab");
      expect(await save.evaluate((element) => element === document.activeElement)).toBe(true);
      expect(
        await save.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            focusVisible: element.hasAttribute("data-focus"),
            style: style.outlineStyle,
            width: style.outlineWidth,
          };
        }),
      ).toEqual({ focusVisible: true, style: "solid", width: "2px" });
      await page.keyboard.press(process.platform === "darwin" ? "Shift+Alt+Tab" : "Shift+Tab");
      await page.keyboard.press("Enter");
      await dialog.waitFor({ state: "detached" });
      await expect
        .poll(() => add.evaluate((element) => element === document.activeElement))
        .toBe(true);

      await add.click();
      // Programmatic focus does not wait for the reopened dialog's entrance transition.
      await close.click({ trial: true });
      if (mode === "points") {
        expect(await dialog.locator("output").first().innerText()).toBe("7");
      } else if (mode === "singleRoundWinner") {
        expect(await dialog.getByRole("radio", { name: "Maya", exact: true }).isChecked()).toBe(
          true,
        );
      } else {
        expect(
          await dialog
            .getByRole("button", { name: "Maya", exact: true })
            .getAttribute("aria-pressed"),
        ).toBe("true");
      }
      await save.focus();
      await page.keyboard.press("Enter");
      await dialog.waitFor({ state: "detached" });
      await page.getByRole("button", { name: "Expand Round 1", exact: true }).waitFor();
      await add.click();
      if (mode === "points") {
        expect(await dialog.locator("output").first().innerText()).toBe("0");
      } else if (mode === "singleRoundWinner") {
        expect(await save.isDisabled()).toBe(true);
      } else {
        expect(
          await dialog
            .getByRole("button", { name: "Maya", exact: true })
            .getAttribute("aria-pressed"),
        ).toBe("false");
      }
      await close.click();
      await dialog.waitFor({ state: "detached" });
    }
  } finally {
    await page.close();
  }
}, 60_000);
