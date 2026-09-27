/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Round, RoundScore } from "../../types";
import { makePhaseGraphGame, phaseGraphPlayers } from "../Standings/phaseGraphTestFixtures";

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
  appUrl = `http://127.0.0.1:${address.port}/phase-10-scoreboard/`;
  browser = await webkit.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

function fontSize(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).fontSize);
}

async function box(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error("Expected a visible typography element");
  return bounds;
}

async function seedGame(page: Page) {
  const players = Array.from({ length: 6 }, (_, index) => ({
    ...phaseGraphPlayers.amy,
    id: `player-${index}`,
    name: `Player ${index}`,
  }));
  const playerIds = players.map((player) => player.id);
  const game = makePhaseGraphGame({
    players: playerIds,
    activePlayers: playerIds,
    phaseSet: {
      id: "typography-phases",
      name: "Typography phases",
      type: "temporary",
      phases: ["phase-1", ...Array.from({ length: 11 }, (_, index) => `phase-${index + 2}`)],
    },
  });
  const rounds: Round[] = Array.from({ length: 10 }, (_, index) => {
    const scores: RoundScore[] = players.map((player, playerIndex) => ({
      playerId: player.id,
      currentPhase: index + 1,
      phaseStatus: "completed",
      score: playerIndex === index % players.length ? 0 : 100,
    }));
    return {
      gameId: game.id,
      roundNumber: index + 1,
      roundWinnerId: players[index % players.length].id,
      scores: [scores[0], ...scores.slice(1)],
    };
  });

  await page.goto(`${appUrl}#/players`);
  await page.getByText("No players yet", { exact: true }).waitFor();
  await page.evaluate(
    ({ game, players, rounds }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("phase10-db");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(["games", "players", "rounds"], "readwrite");
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onabort = () => {
            db.close();
            reject(transaction.error);
          };
          transaction.objectStore("games").put(game);
          for (const player of players) transaction.objectStore("players").put(player);
          for (const round of rounds) transaction.objectStore("rounds").put(round);
        };
      }),
    { game, players, rounds },
  );
  await page.goto(`${appUrl}#/game/${game.id}`);
  await page.getByRole("region", { name: "Scoreboard", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
}

it("centers the Phases control with the independent logo layer across viewport sizes and safe areas", async () => {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    colorScheme: "light",
  });
  try {
    await seedGame(page);
    const button = page.getByRole("button", {
      name: "Open Phases Card",
      exact: true,
      includeHidden: true,
    });
    const logo = page.getByRole("img", { name: "Phaze Compan10n" });
    const header = page.locator(".page-shell-header");
    const main = page.locator(".page-shell-main");
    for (const { width, height, logoHeight, top, left } of [
      { width: 320, height: 568, logoHeight: 54.2, top: 0, left: 0 },
      { width: 390, height: 700, logoHeight: 74, top: 0, left: 0 },
      { width: 390, height: 844, logoHeight: 95.6, top: 0, left: 0 },
      { width: 844, height: 390, logoHeight: 27.5, top: 0, left: 0 },
      { width: 1280, height: 900, logoHeight: 100, top: 0, left: 0 },
      { width: 390, height: 844, logoHeight: 95.6, top: 47, left: 44 },
    ]) {
      await page.setViewportSize({ width, height });
      await page.addStyleTag({
        content: `:root { --safe-area-inset-top: ${top}px; --safe-area-inset-left: ${left}px; }`,
      });
      await expect.poll(async () => (await box(logo)).height).toBeCloseTo(logoHeight, 1);
      const logoBounds = await box(logo);
      const buttonBounds = await box(button);
      const headerBounds = await box(header);
      const mainBounds = await box(main);
      expect(buttonBounds.y + buttonBounds.height / 2).toBeCloseTo(
        logoBounds.y + logoBounds.height / 2,
        1,
      );
      expect(buttonBounds.x).toBe(left + 16);
      expect(buttonBounds.width).toBeGreaterThanOrEqual(48);
      expect(buttonBounds.height).toBe(56);
      expect(logoBounds.x + logoBounds.width / 2).toBeCloseTo(left + (width - left) / 2, 1);
      expect(headerBounds.height).toBeCloseTo(height * 0.15 + top, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

      await button.evaluate((element) => {
        element.setAttribute("hidden", "");
      });
      expect(await box(logo)).toEqual(logoBounds);
      expect(await box(header)).toEqual(headerBounds);
      expect(await box(main)).toEqual(mainBounds);
      await button.evaluate((element) => {
        element.removeAttribute("hidden");
      });
    }
    await button.click();
    await page
      .getByRole("dialog", { name: "Phases Card", exact: true })
      .getByRole("button", { name: "Share Phases Card", exact: true })
      .waitFor();
  } finally {
    await page.close();
  }
}, 30_000);

describe.each([320, 1280])("approved typography at %ipx viewport width", (width) => {
  it("enlarges the Phase Set switch without overflowing its toolbar", async () => {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    try {
      await page.goto(`${appUrl}#/create`);
      await page.getByRole("tab", { name: "Phases", exact: true }).click();
      const button = page.getByRole("button", { name: "Switch phase set", exact: true });
      await button.waitFor();
      expect(await fontSize(button)).toBe("14px");
      await page.evaluate(() => document.fonts.ready);
      const bounds = await box(button);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      await button.click();
      await page
        .getByRole("dialog", { name: "Switch phase set", exact: true })
        .getByPlaceholder(/^Search phase sets/)
        .waitFor();
    } finally {
      await page.close();
    }
  }, 30_000);

  it("preserves scoreboard alignment and hierarchy with larger round numbers and dealer badges", async () => {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    try {
      await seedGame(page);
      const scoreboard = page.getByRole("region", { name: "Scoreboard", exact: true });
      const round = scoreboard.getByRole("button", { name: /^Round 10(?:, expanded)?$/ });
      await round.scrollIntoViewIfNeeded();
      expect.soft(await fontSize(round.locator("span"))).toBe("16px");
      const headers = scoreboard.locator(".scoreboard-cell--sticky-top > div > span:last-child");
      for (const header of await headers.all()) {
        expect.soft(await fontSize(header)).toBe("14px");
        expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
          true,
        );
      }
      const badges = scoreboard.getByText("D", { exact: true });
      for (const badge of await badges.all()) {
        expect.soft(await fontSize(badge)).toBe("12px");
        const bounds = await box(badge);
        expect.soft(bounds.width).toBe(17);
        expect.soft(bounds.height).toBe(17);
        const phase = badge.locator("..").locator(":scope > span.relative");
        const phaseBounds = await box(phase);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(phaseBounds.x);
        expect(bounds.y + bounds.height / 2).toBeCloseTo(phaseBounds.y + phaseBounds.height / 2, 1);
      }
      const phase = round
        .locator("xpath=following-sibling::div[1]")
        .locator(":scope > div > div > span.relative");
      const roundBounds = await box(round.locator("span"));
      const phaseBounds = await box(phase);
      expect.soft(roundBounds.y).toBeCloseTo(phaseBounds.y, 1);
      expect.soft(roundBounds.height).toBe(phaseBounds.height);
      await round.click();
      const expandedScores = scoreboard.locator(".scoreboard-extras--open").first();
      await expect
        .poll(() => expandedScores.evaluate((element) => getComputedStyle(element).opacity))
        .toBe("1");
      expect(await fontSize(expandedScores.locator("span").first())).toBe("14px");
      expect(await fontSize(expandedScores.locator("span").last())).toBe("12px");
      expect((await box(round.locator("span"))).y).toBeCloseTo((await box(phase)).y, 1);
      expect(await fontSize(page.getByRole("button", { name: "Open Phases Card" }))).toBe("10px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    } finally {
      await page.close();
    }
  }, 30_000);
});
