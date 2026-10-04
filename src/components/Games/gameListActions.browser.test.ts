/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

beforeAll(async () => {
  server = await createServer({
    server: { host: "127.0.0.1", port: 0, open: false },
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  appUrl = `http://127.0.0.1:${address.port}/scorekeeper/`;
  browser = await webkit.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

describe.each(["", "/phaseCompan10n"])("Game-list actions under #%s", (ownerPath) => {
  it.each([
    "light",
    "dark",
  ] as const)("keeps Home and history trash actions bare with separate hover and keyboard focus in %s mode", async (colorScheme) => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme,
    });
    page.setDefaultTimeout(5_000);
    page.setDefaultNavigationTimeout(30_000);
    try {
      await seedGames(page);
      for (const path of [ownerPath || "/", `${ownerPath}/games`]) {
        await page.goto(`${appUrl}#${path}`);
        const active = page.getByRole("link", { name: "Continue game with Dana", exact: true });
        await active.waitFor();
        const names = path.endsWith("/games") ? ["Dana", "Casey"] : ["Dana"];
        expect(await page.getByRole("button", { name: /^Delete game with / }).count()).toBe(
          names.length,
        );
        for (const name of names) {
          const remove = page.getByRole("button", {
            name: `Delete game with ${name}`,
            exact: true,
          });
          const open = page.getByRole("link", {
            name:
              name === "Dana" ? "Continue game with Dana" : "View Standings for game with Casey",
            exact: true,
          });
          const row = remove.locator("..");
          const icon = remove.locator("svg");
          const openIcon = open.locator("svg").last();
          await page.mouse.move(0, 0);
          await page.evaluate(() => {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          });
          expect(await bareSurface(remove)).toEqual({
            background: "rgba(0, 0, 0, 0)",
            border: "0px",
            shadow: "none",
            overlay: "none",
          });
          expect(await remove.boundingBox()).toMatchObject({ width: 32, height: 32 });
          expect(await icon.boundingBox()).toMatchObject({ width: 16, height: 16 });
          expect(await icon.getAttribute("aria-hidden")).toBe("true");
          expect(await icon.evaluate((element) => getComputedStyle(element).fill)).toBe("none");
          expect(await outline(remove)).toMatchObject({ style: "none" });
          const idleOpenColor = await openIcon.evaluate(
            (element) => getComputedStyle(element).color,
          );

          await open.hover();
          expect(
            await row.evaluate((element) => getComputedStyle(element).backgroundColor),
          ).not.toBe("rgba(0, 0, 0, 0)");
          await remove.hover();
          expect(await row.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
            "rgba(0, 0, 0, 0)",
          );
          expect(await openIcon.evaluate((element) => getComputedStyle(element).color)).toBe(
            idleOpenColor,
          );
          expect(await openIcon.evaluate((element) => getComputedStyle(element).fill)).toBe("none");
          expect((await bareSurface(remove)).background).not.toBe("rgba(0, 0, 0, 0)");
          await expectDangerColor(icon);
          const colors = await icon.evaluate((element) => {
            const style = getComputedStyle(element);
            return { fill: style.fill, color: style.color };
          });
          expect(colors.fill).toBe(colors.color);

          await page.mouse.move(0, 0);
          await open.focus();
          await page.keyboard.press(process.platform === "darwin" ? "Alt+Tab" : "Tab");
          expect(await remove.evaluate((element) => element === document.activeElement)).toBe(true);
          const focused = await outline(remove);
          expect(focused.style).toBe("solid");
          expect(focused.width).toBe("2px");
          expect(focused.color).toBe(focused.textColor);
          expect(await bareSurface(remove)).toMatchObject({
            background: "rgba(0, 0, 0, 0)",
            border: "0px",
            shadow: "none",
          });
        }
      }
    } finally {
      await page.close();
    }
  }, 60_000);

  it.each([
    "light",
    "dark",
  ] as const)("preserves pointer and keyboard deletion, disabled feedback, and hit separation in %s mode", async (colorScheme) => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme,
    });
    page.setDefaultTimeout(5_000);
    page.setDefaultNavigationTimeout(30_000);
    try {
      await seedGames(page);
      for (const { path, name, key } of [
        { path: ownerPath || "/", name: "Dana", key: null },
        {
          path: `${ownerPath}/games`,
          name: "Casey",
          key: colorScheme === "light" ? "Enter" : "Space",
        },
      ]) {
        await page.goto(`${appUrl}#${path}`);
        const remove = page.getByRole("button", {
          name: `Delete game with ${name}`,
          exact: true,
        });
        await remove.waitFor();
        const destination = page.url();
        const box = await remove.boundingBox();
        if (!box) throw new Error("Missing trash action bounds");
        await holdNextDeletion(page, ownerPath);
        if (key) {
          await page.getByRole("link", { name: `View Standings for game with ${name}` }).focus();
          await page.keyboard.press(process.platform === "darwin" ? "Alt+Tab" : "Tab");
          await page.keyboard.press(key);
        } else {
          await remove.click();
          expect(await outline(remove)).toMatchObject({ style: "none" });
        }
        await expect.poll(() => remove.isDisabled()).toBe(true);
        await page.mouse.move(0, 0);
        expect(await bareSurface(remove)).toEqual({
          background: "rgba(0, 0, 0, 0)",
          border: "0px",
          shadow: "none",
          overlay: "none",
        });
        expect(
          await remove.evaluate((element) => {
            const style = getComputedStyle(element);
            return { opacity: style.opacity, pointerEvents: style.pointerEvents };
          }),
        ).toEqual({ opacity: "0.4", pointerEvents: "none" });
        await page.keyboard.press("Enter");
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        expect(await remove.count()).toBe(1);
        expect(page.url()).toBe(destination);
        expect(await page.getByRole("dialog").count()).toBe(0);
        await page.evaluate("window.releaseGameDeletion()");
        await remove.waitFor({ state: "detached" });
        expect(page.url()).toBe(destination);
        expect(await page.getByRole("dialog").count()).toBe(0);
      }
      await page.reload();
      await page.getByText("No games yet", { exact: true }).waitFor();
    } finally {
      await page.close();
    }
  }, 60_000);
});

function bareSurface(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      border: style.borderWidth,
      shadow: style.boxShadow,
      overlay: getComputedStyle(element, "::after").content,
    };
  });
}

function outline(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      color: style.outlineColor,
      textColor: style.color,
    };
  });
}

async function expectDangerColor(icon: Locator) {
  const colors = await icon.evaluate((element) => {
    const sample = document.createElement("span");
    sample.style.color = "var(--color-pt-red-500)";
    document.body.append(sample);
    const expected = getComputedStyle(sample).color;
    sample.remove();
    return { actual: getComputedStyle(element).color, expected };
  });
  expect(colors.actual).toBe(colors.expected);
}

async function holdNextDeletion(page: Page, ownerPath: string) {
  const module = ownerPath ? "games" : "genericGames";
  await page.evaluate(`
    import("/scorekeeper/src/data/api/${module}.ts").then(({ ${module}Api: api }) => {
      const original = api.delete;
      const ready = new Promise(resolve => { window.releaseGameDeletion = resolve; });
      api.delete = async (...args) => {
        api.delete = original;
        await ready;
        return original(...args);
      };
    })
  `);
}

async function seedGames(page: Page) {
  await page.goto(`${appUrl}#/players`);
  await page.getByText("No players yet", { exact: true }).waitFor();
  await page.evaluate(`(async () => {
    const { playersApi } = await import("/scorekeeper/src/data/api/players.ts");
    const { gamesApi } = await import("/scorekeeper/src/data/api/games.ts");
    const { roundsApi } = await import("/scorekeeper/src/data/api/rounds.ts");
    const { genericGamesApi } = await import("/scorekeeper/src/data/api/genericGames.ts");
    const { genericRoundsApi } = await import("/scorekeeper/src/data/api/genericRounds.ts");
    const dana = await playersApi.create({ name: "Dana", color: "Ocean", isFavorite: 0 });
    const casey = await playersApi.create({ name: "Casey", color: "Jam", isFavorite: 0 });
    const phaseInput = {
      phaseSet: { id: "short", type: "temporary", name: "Short", phases: ["phase-1"] },
      settings: { tiebreaker: "lowestPoints", roundSkipPenalty: 0, sitOutPenalty: 0 },
    };
    const genericSettings = {
      mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false,
    };
    await gamesApi.create({ ...phaseInput, players: [dana.id] });
    const phase = await gamesApi.create({ ...phaseInput, players: [casey.id] });
    await roundsApi.add({
      gameId: phase.id, roundWinnerId: casey.id,
      scores: [{ playerId: casey.id, phaseStatus: "completed", score: 0 }],
    });
    await genericGamesApi.create({ players: [dana.id], settings: genericSettings });
    const generic = await genericGamesApi.create({ players: [casey.id], settings: genericSettings });
    await genericRoundsApi.add({
      gameId: generic.id, mode: "points", scores: [{ playerId: casey.id, points: "5" }],
    });
    await genericGamesApi.finish(generic.id);
  })()`);
}
