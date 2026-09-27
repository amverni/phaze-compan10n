/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Game, Player } from "../../types";

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

it("opens final Standings after a finishing Round and keeps completed snapshot names and colors after saved Players change", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${appUrl}#/phaseCompan10n/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    const { game, players } = await seedCompletionGame(page);
    const [amy, bob] = players;

    await page.goto(`${appUrl}#/phaseCompan10n/game/${game.id}`);
    await page.getByRole("button", { name: "Add round 1", exact: true }).click();
    const entry = page.getByRole("dialog");
    await entry.getByRole("button", { name: /Round Winner/ }).click();
    await page.getByRole("option", { name: "Amy Jones", exact: true }).click();
    await entry.getByRole("tab", { name: "Bob Stone", exact: true }).click();
    await entry.getByRole("button", { name: "Failed", exact: true }).click();
    await entry.getByRole("button", { name: "Save round", exact: true }).click();

    const standings = page.getByRole("dialog").filter({
      has: page.getByRole("tab", { name: "Standings", exact: true }),
    });
    const results = standings.getByRole("tabpanel", { name: "Standings", exact: true });
    await results.waitFor({ timeout: 5_000 });
    expect(await results.innerText()).toContain("Amy Jones");
    expect(await results.innerText()).toContain("Bob Stone");
    expect(await results.innerText()).toContain("1 win");
    expect(await results.innerText()).toContain("0 wins");
    expect(await readResults(page)).toEqual({
      games: [
        expect.objectContaining({
          status: "completed",
          completionType: "normal",
          winnerIds: [amy.id],
          playerSnapshots: [
            { id: amy.id, name: "Amy Jones", color: "#123456" },
            { id: bob.id, name: "Bob Stone", color: "#abcdef" },
          ],
        }),
      ],
      players,
    });

    await page.keyboard.press("Escape");
    await standings.waitFor({ state: "detached" });
    expect(await page.getByRole("button", { name: /^Add round/ }).count()).toBe(0);
    expect(await readScoreboardHeaderPlayers(page)).toEqual([
      { backgroundColor: "rgb(18, 52, 86)", initials: "AJ" },
      { backgroundColor: "rgb(171, 205, 239)", initials: "BS" },
    ]);

    await updateAndDeleteSavedPlayers(page, amy.id, bob.id);

    await page.reload();
    await page.getByRole("region", { name: "Scoreboard", exact: true }).waitFor({ timeout: 5_000 });
    expect(await readResults(page)).toMatchObject({
      games: [
        expect.objectContaining({
          completionType: "normal",
          winnerIds: [amy.id],
          playerSnapshots: [
            { id: amy.id, name: "Amy Jones", color: "#123456" },
            { id: bob.id, name: "Bob Stone", color: "#abcdef" },
          ],
        }),
      ],
      players: [expect.objectContaining({ id: amy.id, name: "Zoe Quinn", color: "#654321" })],
    });
    expect(await readScoreboardHeaderPlayers(page)).toEqual([
      { backgroundColor: "rgb(18, 52, 86)", initials: "AJ" },
      { backgroundColor: "rgb(171, 205, 239)", initials: "BS" },
    ]);

    const reloadedStandings = await openStandings(page);
    const reloadedResults = reloadedStandings.getByRole("tabpanel", {
      name: "Standings",
      exact: true,
    });
    await reloadedResults.waitFor();
    const reloadedStandingsText = await reloadedResults.innerText();
    expect(reloadedStandingsText).toContain("Amy Jones");
    expect(reloadedStandingsText).toContain("Bob Stone");
    expect(reloadedStandingsText).not.toContain("Zoe Quinn");
    expect(
      await readAvatarBackgroundColors(reloadedResults.locator('span[style*="background-color"]')),
    ).toEqual(["rgb(18, 52, 86)", "rgb(171, 205, 239)"]);

    await reloadedStandings.getByRole("tab", { name: "Phases", exact: true }).click();
    await reloadedStandings.locator('[aria-label="Phase progress by round"]').waitFor();
    const phaseMarkup = await reloadedStandings.innerHTML();
    expect(phaseMarkup).toContain("Amy Jones");
    expect(phaseMarkup).toContain("Bob Stone");
    expect(phaseMarkup).not.toContain("Zoe Quinn");
    const phaseStrokes = await reloadedStandings
      .locator('[aria-label="Phase progress by round"] path[stroke]')
      .evaluateAll((paths) =>
        paths
          .map((path) => path.getAttribute("stroke"))
          .filter((stroke): stroke is string => Boolean(stroke)),
      );
    expect(phaseStrokes).toContain("#123456");
    expect(phaseStrokes).toContain("#abcdef");
    expect(phaseStrokes).not.toContain("#654321");
    expect(pageErrors).toEqual([]);
  } finally {
    await page.close();
  }
}, 30_000);

function seedCompletionGame(page: Page) {
  return page.evaluate<{ game: Game; players: Player[] }>(`
    Promise.all([
      import("/phase-10-scoreboard/src/data/api/games.ts"),
      import("/phase-10-scoreboard/src/data/api/players.ts")
    ]).then(async ([{ gamesApi }, { playersApi }]) => {
      const amy = await playersApi.create({
        name: "Amy Jones",
        color: "#123456",
        isFavorite: 0
      });
      const bob = await playersApi.create({
        name: "Bob Stone",
        color: "#abcdef",
        isFavorite: 0
      });
      const game = await gamesApi.create({
        scorekeeper: "phase10",
        phaseSet: {
          id: "short-phases",
          type: "temporary",
          name: "One Phase",
          phases: ["phase-1"]
        },
        players: [amy.id, bob.id],
        settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 0 }
      });
      return { game, players: [amy, bob] };
    })
  `);
}

async function openStandings(page: Page) {
  const standings = page.getByRole("dialog").filter({
    has: page.getByRole("tab", { name: "Standings", exact: true }),
  });
  if ((await standings.count()) === 0) {
    await page.getByRole("button", { name: "Open Standings", exact: true }).click();
  }
  await standings.waitFor({ state: "attached", timeout: 5_000 });
  return standings;
}

function updateAndDeleteSavedPlayers(page: Page, renamedId: string, removedId: string) {
  return page.evaluate(`
    Promise.all([
      import("/phase-10-scoreboard/src/data/api/players.ts").then(({ playersApi }) =>
        playersApi.update(${JSON.stringify(renamedId)}, { name: "Zoe Quinn", color: "#654321" })
      ),
      import("/phase-10-scoreboard/src/data/api/players.ts").then(({ playersApi }) =>
        playersApi.delete(${JSON.stringify(removedId)})
      )
    ])
  `);
}

function readScoreboardHeaderPlayers(page: Page) {
  return page
    .locator('.scoreboard-cell--sticky-top > div > span[style*="background-color"]')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        backgroundColor: getComputedStyle(element as HTMLElement).backgroundColor,
        initials:
          Array.from(element.querySelectorAll("span"))
            .map((span) => span.textContent?.trim() ?? "")
            .join("")
            .trim() ||
          element.textContent?.trim() ||
          "",
      })),
    );
}

function readAvatarBackgroundColors(locator: Locator) {
  return locator.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element as HTMLElement).backgroundColor),
  );
}

function readResults(page: Page) {
  // Keep these imports in the browser rather than Vitest's SSR module loader.
  return page.evaluate<{ games: Array<Record<string, unknown>>; players: Player[] }>(`
    Promise.all([
      import("/phase-10-scoreboard/src/data/api/games.ts").then(({ gamesApi }) =>
        gamesApi.getAll()
      ),
      import("/phase-10-scoreboard/src/data/api/players.ts").then(({ playersApi }) =>
        playersApi.getAll()
      )
    ]).then(([games, players]) => ({ games, players }))
  `);
}
