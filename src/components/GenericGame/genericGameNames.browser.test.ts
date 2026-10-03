/// <reference types="node" />

import type { Browser, Locator } from "playwright";
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

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const longName = "Friday cards with the whole neighborhood and visiting friends";

it.each([
  { width: 320, colorScheme: "light" as const },
  { width: 390, colorScheme: "dark" as const },
  { width: 768, colorScheme: "light" as const },
])("prioritizes names over avatars without squeezing Game-list actions at $width in $colorScheme", async ({
  width,
  colorScheme,
}) => {
  const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme });
  page.setDefaultTimeout(5_000);
  page.setDefaultNavigationTimeout(30_000);
  try {
    await page.goto(appUrl);
    await page.getByText("No active games yet", { exact: true }).waitFor();
    await page.evaluate(`
      (async () => {
        const { playersApi } = await import("/phase-10-scoreboard/src/data/api/players.ts");
        const { genericGamesApi } = await import("/phase-10-scoreboard/src/data/api/genericGames.ts");
        const { genericRoundsApi } = await import("/phase-10-scoreboard/src/data/api/genericRounds.ts");
        const players = [];
        for (const name of ["Maya", "Rowan", "Lee", "Alex", "Dana", "Casey", "Sasha", "Jules"]) {
          players.push(await playersApi.create({ name, color: "Jam", isFavorite: 0 }));
        }
        const input = {
          players: players.map(player => player.id),
          settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false }
        };
        await genericGamesApi.create({ ...input, name: ${JSON.stringify(longName)} });
        await genericGamesApi.create({ ...input, name: "Cards" });
        await genericGamesApi.create(input);
        const result = await genericGamesApi.create({ ...input, name: ${JSON.stringify(longName)} });
        await genericRoundsApi.add({
          gameId: result.id, mode: "points",
          scores: players.map(player => ({ playerId: player.id, points: "0" }))
        });
        await genericGamesApi.finish(result.id);
      })()
    `);
    const playerSummary = "Maya, Rowan, Lee, Alex, Dana, Casey, Sasha, Jules";
    for (const route of ["/", "/games"]) {
      await page.goto(`${appUrl}#${route}`);
      await page.reload();
      const unnamed = page.getByRole("link", {
        name: `Continue game with ${playerSummary}`,
        exact: true,
      });
      await unnamed.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const timestamp = unnamed.getByText("just now", { exact: true });
      const unnamedTime = await timestamp.boundingBox();
      const unnamedOpen = await unnamed.locator("svg").last().boundingBox();
      const unnamedDelete = await page
        .getByRole("button", { name: `Delete game with ${playerSummary}`, exact: true })
        .boundingBox();
      if (!unnamedTime || !unnamedOpen || !unnamedDelete)
        throw new Error("Missing unnamed actions");
      expect(await unnamed.locator("div > span").count()).toBeGreaterThan(1);

      for (const { name, action } of [
        { name: longName, action: "Continue" },
        { name: "Cards", action: "Continue" },
        ...(route === "/games" ? [{ name: longName, action: "View Standings for" }] : []),
      ]) {
        const open = page.getByRole("link", {
          name: `${action} game "${name}" with ${playerSummary}`,
          exact: true,
        });
        await open.waitFor();
        const title = open.getByText(name, { exact: true });
        const area = title.locator("..");
        const avatars = area.locator("div").last();
        if (name === longName) {
          await expect.poll(() => avatars.locator(":scope > span").count()).toBe(0);
          await expectTruncatedTitle(title);
        } else {
          await expect.poll(() => avatars.locator(":scope > span").count()).toBeGreaterThan(0);
          const titleBox = await title.boundingBox();
          const avatarBox = await avatars.boundingBox();
          if (!titleBox || !avatarBox) throw new Error("Missing name/avatar area");
          expect(titleBox.x + titleBox.width).toBeLessThanOrEqual(avatarBox.x + 1);
          expect(
            await title.evaluate((element) => element.scrollWidth <= element.clientWidth),
          ).toBe(true);
        }
        const time = await open.getByText("just now", { exact: true }).boundingBox();
        const icon = await open.locator("svg").last().boundingBox();
        const remove = open.locator("..").getByRole("button", {
          name: `Delete game "${name}" with ${playerSummary}`,
          exact: true,
        });
        const trash = await remove.boundingBox();
        if (!time || !icon || !trash) throw new Error("Missing named actions");
        expect(time.x).toBeCloseTo(unnamedTime.x, 0);
        expect(time.width).toBeCloseTo(unnamedTime.width, 0);
        expect(icon.x).toBeCloseTo(unnamedOpen.x, 0);
        expect(icon.width).toBe(16);
        expect(trash.x).toBeCloseTo(unnamedDelete.x, 0);
        expect(trash.width).toBe(32);
        expect(trash.x + trash.width).toBeLessThanOrEqual(width);
        await open.focus();
        await page.keyboard.press(process.platform === "darwin" ? "Alt+Tab" : "Tab");
        expect(await remove.evaluate((element) => element === document.activeElement)).toBe(true);
      }
    }
    const completed = page.getByRole("link", {
      name: `View Standings for game "${longName}" with ${playerSummary}`,
      exact: true,
    });
    await completed.click();
    const standings = page.getByRole("dialog", { name: "Standings", exact: true });
    await standings.getByRole("list", { name: "Standings places", exact: true }).waitFor();
    await standings.getByRole("button", { name: "Close", exact: true }).click();
    await standings.waitFor({ state: "detached" });
    expect(await page.getByRole("heading", { name: longName, exact: true }).count()).toBe(1);
  } finally {
    await page.close();
  }
}, 60_000);

it.each([
  { name: `  ${longName}  `, title: longName },
  { name: "   ", title: null },
  { name: "", title: null },
])("creates and reopens a Game with name '$name' and no scoring caption fallback", async ({
  name,
  title,
}) => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  page.setDefaultTimeout(5_000);
  page.setDefaultNavigationTimeout(30_000);
  try {
    await page.goto(`${appUrl}#/create`);
    await page.getByRole("tab", { name: "Players", exact: true }).waitFor();
    await page.evaluate(`
      import("/phase-10-scoreboard/src/data/api/players.ts").then(({ playersApi }) =>
        playersApi.create({ name: "Maya", color: "Jam", isFavorite: 1 }))
    `);
    await page.reload();
    await page.getByRole("button", { name: "Maya", exact: true }).click();
    await page.getByRole("tab", { name: "Settings", exact: true }).click();
    const input = page.getByRole("textbox", { name: "Game name", exact: true });
    await input.fill(name);
    await input.focus();
    expect(await input.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("solid");
    await page.getByRole("switch", { name: "Enable Tiebreaker", exact: true }).click();
    await page.getByRole("tab", { name: "Players", exact: true }).click();
    await page.getByRole("tab", { name: "Settings", exact: true }).click();
    expect(await input.inputValue()).toBe(name);
    await page.getByRole("button", { name: "Start", exact: true }).click();
    for (let visit = 0; visit < 2; visit++) {
      if (visit) await page.reload();
      const scoreboard = page.getByRole("region", { name: "Scoreboard", exact: true });
      await scoreboard.waitFor();
      expect(await page.getByText(/Points - |Tiebreaker - /).count()).toBe(0);
      const heading = page.getByRole("heading", { level: 1 });
      if (title) {
        expect(await heading.innerText()).toBe(title);
        await expectTruncatedTitle(heading);
      } else {
        expect(await heading.count()).toBe(0);
        const gap = await scoreboard.evaluate((element) => {
          const main = element.closest(".page-shell-main");
          if (!main) throw new Error("Missing main region");
          return element.getBoundingClientRect().top - main.getBoundingClientRect().top;
        });
        expect(gap).toBeCloseTo(16, 0);
      }
    }
    await page.goto(`${appUrl}#/phaseCompan10n/create`);
    await page.getByRole("tab", { name: "Settings", exact: true }).click();
    expect(await page.getByRole("textbox", { name: "Game name", exact: true }).count()).toBe(0);
  } finally {
    await page.close();
  }
}, 60_000);

async function expectTruncatedTitle(title: Locator) {
  expect(
    await title.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        truncated: element.scrollWidth > element.clientWidth,
        overflow: style.textOverflow,
        whiteSpace: style.whiteSpace,
      };
    }),
  ).toEqual({ truncated: true, overflow: "ellipsis", whiteSpace: "nowrap" });
}
