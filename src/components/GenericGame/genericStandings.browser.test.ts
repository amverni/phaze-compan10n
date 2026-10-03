/// <reference types="node" />

import type { Browser, Page } from "playwright";
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
  appUrl = `http://127.0.0.1:${address.port}/phase-10-scoreboard/`;
  browser = await webkit.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

interface StandingsCase {
  name: string;
  settings: GenericGameSettings;
  rounds: number[][];
  tiebreakers?: number[];
  names: string[];
  places: number[];
  badges: string[];
}

async function openStandingsGame(page: Page, testCase: StandingsCase) {
  await page.goto(appUrl);
  await page.getByText("No active games yet", { exact: true }).waitFor();
  await page.evaluate(`(async () => {
    const { playersApi } = await import("/phase-10-scoreboard/src/data/api/players.ts");
    const { genericGamesApi } = await import("/phase-10-scoreboard/src/data/api/genericGames.ts");
    const { genericRoundsApi } = await import("/phase-10-scoreboard/src/data/api/genericRounds.ts");
    const { settings, rounds, tiebreakers } = ${JSON.stringify(testCase)};
    const names = ["Zed", "Amy", "Rowan", "Lee", "Bea", "Cam", "Dan"];
    const players = [];
    for (const name of names.slice(0, rounds[0].length)) {
      players.push(await playersApi.create({ name, color: "Jam", isFavorite: 0 }));
    }
    const game = await genericGamesApi.create({ players: players.map(player => player.id), settings });
    for (const totals of rounds) {
      await genericRoundsApi.add({
        gameId: game.id,
        mode: settings.mode,
        scores: players.map((player, index) => settings.mode === "points"
          ? {
              playerId: player.id,
              points: String(totals[index]),
              ...(tiebreakers && { tiebreaker: String(tiebreakers[index]) }),
            }
          : settings.mode === "singleRoundWinner"
            ? { playerId: player.id, won: totals[index] === 1 }
            : { playerId: player.id, passed: totals[index] === 1 }),
      });
    }
    location.hash = "/game/" + game.id;
  })()`);
  await page.getByRole("button", { name: "Open Standings", exact: true }).click();
}

it.each<StandingsCase>([
  {
    name: "Points tied at first place",
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
    rounds: [[10, 0, 10]],
    names: ["Zed", "Rowan", "Amy"],
    places: [1, 1, 3],
    badges: ["1", "", "3"],
  },
  {
    name: "Points with three-Player ties at first and lower places",
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
    rounds: [[20, 0, 20, 10, 10, 20, 10]],
    names: ["Zed", "Rowan", "Cam", "Lee", "Bea", "Dan", "Amy"],
    places: [1, 1, 1, 4, 4, 4, 7],
    badges: ["1", "", "", "4", "", "", "7"],
  },
  {
    name: "low-wins Points tied at second place",
    settings: { mode: "points", pointsDirection: "low", tiebreaker: null, dealer: false },
    rounds: [[0, -10, 0]],
    names: ["Amy", "Zed", "Rowan"],
    places: [1, 2, 2],
    badges: ["1", "2", ""],
  },
  {
    name: "all-tied Points",
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
    rounds: [[-10, -10, -10]],
    names: ["Zed", "Amy", "Rowan"],
    places: [1, 1, 1],
    badges: ["1", "", ""],
  },
  {
    name: "Points without ties",
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
    rounds: [[0, 10, -10]],
    names: ["Amy", "Zed", "Rowan"],
    places: [1, 2, 3],
    badges: ["1", "2", "3"],
  },
  ...(["high", "low"] as const).flatMap((pointsDirection) =>
    (["high", "low"] as const).map(
      (direction): StandingsCase => ({
        name: `${pointsDirection}-wins Points with ${direction}-wins Tiebreaker breaking a primary tie`,
        settings: { mode: "points", pointsDirection, tiebreaker: { direction }, dealer: false },
        rounds: [pointsDirection === "high" ? [10, 10, 10, 0] : [-10, -10, -10, 0]],
        tiebreakers: direction === "high" ? [2, 4, 2, 100] : [2, 0, 2, -100],
        names: ["Amy", "Zed", "Rowan", "Lee"],
        places: [1, 2, 2, 4],
        badges: ["1", "2", "", "4"],
      }),
    ),
  ),
  {
    name: "Single Round Winner tied at first and lower places",
    settings: { mode: "singleRoundWinner", tiebreaker: null, dealer: false },
    rounds: [
      [1, 0, 0, 0],
      [0, 0, 1, 0],
    ],
    names: ["Zed", "Rowan", "Amy", "Lee"],
    places: [1, 1, 3, 3],
    badges: ["1", "", "3", ""],
  },
  {
    name: "all-tied Single Round Winner",
    settings: { mode: "singleRoundWinner", tiebreaker: null, dealer: false },
    rounds: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    names: ["Zed", "Amy", "Rowan"],
    places: [1, 1, 1],
    badges: ["1", "", ""],
  },
  {
    name: "Single Round Winner without ties",
    settings: { mode: "singleRoundWinner", tiebreaker: null, dealer: false },
    rounds: [
      [1, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ],
    names: ["Zed", "Amy", "Rowan"],
    places: [1, 2, 3],
    badges: ["1", "2", "3"],
  },
  {
    name: "Pass/Fail tied at first and lower places",
    settings: { mode: "passFail", tiebreaker: null, dealer: false },
    rounds: [[1, 0, 1, 0]],
    names: ["Zed", "Rowan", "Amy", "Lee"],
    places: [1, 1, 3, 3],
    badges: ["1", "", "3", ""],
  },
  {
    name: "all-tied Pass/Fail",
    settings: { mode: "passFail", tiebreaker: null, dealer: false },
    rounds: [[0, 0, 0]],
    names: ["Zed", "Amy", "Rowan"],
    places: [1, 1, 1],
    badges: ["1", "", ""],
  },
  {
    name: "Pass/Fail without ties",
    settings: { mode: "passFail", tiebreaker: null, dealer: false },
    rounds: [
      [1, 0, 0],
      [1, 1, 0],
    ],
    names: ["Zed", "Amy", "Rowan"],
    places: [1, 2, 3],
    badges: ["1", "2", "3"],
  },
])("shows each place badge once for $name in Active and Completed Games", async (testCase) => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  page.setDefaultTimeout(5_000);
  page.setDefaultNavigationTimeout(30_000);
  try {
    await openStandingsGame(page, testCase);
    const dialog = page.getByRole("dialog", { name: "Standings", exact: true });
    for (const status of ["active", "completed"] as const) {
      const list = dialog.getByRole("list", { name: "Standings places", exact: true });
      await list.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const rows = list.getByRole("listitem");
      expect(await rows.locator("[title]").allTextContents()).toEqual(testCase.names);
      const badges = rows.locator(":scope > span[aria-hidden]");
      expect(
        await badges.evaluateAll((elements) =>
          elements.map((element) =>
            getComputedStyle(element).opacity === "0" ? "" : element.textContent,
          ),
        ),
      ).toEqual(testCase.badges);
      const firstBadge = await badges.first().boundingBox();
      const firstName = await rows.first().getByTitle(testCase.names[0]).boundingBox();
      const firstAvatar = await rows.first().locator(":scope > span:has(svg)").boundingBox();
      const firstScore = await rows.first().locator(":scope > span:last-child").boundingBox();
      if (!firstBadge || !firstName || !firstAvatar || !firstScore) {
        throw new Error("Missing Standings geometry");
      }
      for (const [index, place] of testCase.places.entries()) {
        const row = rows.nth(index);
        const announcement = testCase.badges[index] ? `Place ${place}` : `Tied for place ${place}`;
        expect(await row.ariaSnapshot()).toContain(announcement);
        const badge = await badges.nth(index).boundingBox();
        const name = await row.getByTitle(testCase.names[index]).boundingBox();
        const avatar = await row.locator(":scope > span:has(svg)").boundingBox();
        const score = await row.locator(":scope > span:last-child").boundingBox();
        if (!badge || !name || !avatar || !score) {
          throw new Error("Missing tied Standings geometry");
        }
        expect(badge.width).toBeCloseTo(firstBadge.width, 1);
        expect(badge.x).toBeCloseTo(firstBadge.x, 1);
        expect(name.x).toBeCloseTo(firstName.x, 1);
        expect(avatar.x).toBeCloseTo(firstAvatar.x, 1);
        expect(score.x + score.width).toBeCloseTo(firstScore.x + firstScore.width, 1);
      }
      if (status === "active") {
        await dialog.getByRole("button", { name: "Close", exact: true }).click();
        await dialog.waitFor({ state: "detached" });
        await page.getByRole("button", { name: "Finish Game", exact: true }).click();
        await page
          .getByRole("dialog", { name: "Finish Game", exact: true })
          .getByRole("button", { name: "Finish", exact: true })
          .click();
      }
    }
  } finally {
    await page.close();
  }
}, 60_000);
