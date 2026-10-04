/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Game, GameTiebreaker, Player } from "../../types";

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

it("matches Save and Cancel icon colors in both themes", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(`${appUrl}#/phaseCompan10n/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    const { game } = await seedCompletionGame(page);
    await page.goto(`${appUrl}#/phaseCompan10n/game/${game.id}`);
    await page.getByRole("button", { name: "Add round 1", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    const save = dialog.getByRole("button", { name: "Save round", exact: true });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      const cancelColor = await cancel
        .locator("svg")
        .evaluate((element) => getComputedStyle(element).color);
      await expect
        .poll(() => save.locator("svg").evaluate((element) => getComputedStyle(element).color))
        .toBe(cancelColor);
    }
  } finally {
    await page.close();
  }
}, 60_000);

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
    expect(await page.getByRole("button", { name: "Finish Game" }).count()).toBe(0);
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

it("offers Pause and Delete before a saved Round, retains a closed draft, and discards it only when leaving", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  page.setDefaultTimeout(5_000);
  page.setDefaultNavigationTimeout(30_000);
  try {
    await page.goto(`${appUrl}#/phaseCompan10n/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    const { game } = await seedCompletionGame(page, 3);
    await page.goto(`${appUrl}#/phaseCompan10n/game/${game.id}`);

    const finishGame = page.getByRole("button", { name: "Finish Game", exact: true });
    await finishGame.click();
    const finish = page.getByRole("dialog", { name: "Finish Game", exact: true });
    expect(await finish.getByRole("button").allTextContents()).toEqual(["Pause", "Delete"]);
    expect(await finish.innerText()).not.toContain("Save at least one Round");
    expect(await finish.getByRole("heading").count()).toBe(0);
    await page.keyboard.press("Escape");
    await finish.waitFor({ state: "detached" });
    expect(await finishGame.evaluate((button) => button === document.activeElement)).toBe(true);

    const backBox = await page.getByRole("link", { name: "Go home", exact: true }).boundingBox();
    const finishBox = await finishGame.boundingBox();
    const standingsBox = await page.getByRole("button", { name: "Open Standings" }).boundingBox();
    if (!backBox || !finishBox || !standingsBox) throw new Error("Missing Game controls");
    expect(backBox.x).toBeLessThan(195);
    expect(backBox.y).toBeGreaterThan(422);
    expect(finishBox.x).toBeGreaterThan(195);
    expect(finishBox.y).toBeGreaterThan(422);
    expect(standingsBox.x).toBeGreaterThan(195);
    expect(standingsBox.y).toBeLessThan(422);
    await page.getByRole("button", { name: "Open Phases Card" }).click();
    await page.getByRole("dialog", { name: "Phases Card" }).waitFor({ state: "attached" });
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });

    await page.getByRole("button", { name: "Add round 1", exact: true }).click();
    const entry = page.getByRole("dialog");
    await entry.getByRole("button", { name: /Round Winner/ }).click();
    await page.getByRole("option", { name: "Amy Jones", exact: true }).click();
    expect(await finishGame.count()).toBe(0);
    await page.keyboard.press("Tab");
    expect(await entry.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await entry.waitFor({ state: "detached" });
    await finishGame.click();
    await page.mouse.click(4, 4);
    await finish.waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Add round 1", exact: true }).click();
    expect(await entry.getByRole("button", { name: /Round Winner/ }).innerText()).toContain(
      "Amy Jones",
    );
    await page.keyboard.press("Escape");
    await entry.waitFor({ state: "detached" });
    await finishGame.click();
    await finish.getByRole("button", { name: "Pause", exact: true }).click();
    await page.waitForURL("**/#/phaseCompan10n");
    expect(await readResults(page)).toMatchObject({ games: [{ id: game.id, status: "active" }] });
    await page.getByRole("link", { name: /^Continue game with/ }).click();
    await page.getByRole("button", { name: "Add round 1", exact: true }).click();
    expect(await entry.getByRole("button", { name: /Round Winner/ }).innerText()).toContain(
      "Choose winner",
    );
  } finally {
    await page.close();
  }
}, 30_000);

it.each([
  true,
  false,
])("finishes from saved Standings (tied: %s) and reopens a read-only result once", async (tied) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    await page.goto(`${appUrl}#/phaseCompan10n/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    const { game, players } = await seedCompletionGame(page, 3, "lowestPoints");
    await seedSavedRound(page, game, players, tied);
    await page.goto(`${appUrl}#/phaseCompan10n/game/${game.id}`);
    await page.getByRole("button", { name: "Add round 2", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Round Winner/ })
      .click();
    await page.getByRole("option", { name: "Bob Stone", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });

    await page.getByRole("button", { name: "Finish Game", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Finish Game", exact: true })
      .getByRole("button", { name: "Finish", exact: true })
      .click();
    const results = page.getByRole("tabpanel", { name: "Standings", exact: true });
    await results.waitFor({ timeout: 5_000 });
    await page.getByRole("dialog", { name: "Finish Game", exact: true }).waitFor({
      state: "detached",
    });
    expect(await results.innerText()).toContain("Amy Jones");
    expect(await results.innerText()).toContain("Bob Stone");
    expect(await readResults(page)).toMatchObject({
      games: [
        {
          status: "completed",
          completionType: "manual",
          winnerIds: tied ? [players[0].id, players[1].id] : [players[0].id],
          playerSnapshots: [
            { id: players[0].id, name: "Amy Jones", color: "#123456" },
            { id: players[1].id, name: "Bob Stone", color: "#abcdef" },
          ],
        },
      ],
    });
    expect(await readRounds(page, game.id)).toMatchObject([
      { roundNumber: 1, scores: [{ currentPhase: 1 }, { currentPhase: 1 }] },
    ]);

    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });
    expect(await page.getByRole("button", { name: /^Add round|^Finish Game$/ }).count()).toBe(0);
    await page.getByRole("button", { name: "Open Standings", exact: true }).click();
    await results.waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });

    await updateAndDeleteSavedPlayers(page, players[0].id, players[1].id);
    await page.reload();
    await results.waitFor();
    expect(await results.innerText()).toContain("Amy Jones");
    expect(await results.innerText()).toContain("Bob Stone");
    expect(await results.innerText()).not.toContain("Zoe Quinn");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "detached" });
    await page.getByRole("region", { name: "Scoreboard", exact: true }).click();
    expect(await page.getByRole("dialog").count()).toBe(0);
    expect(await page.getByRole("button", { name: /^Add round|^Finish Game$/ }).count()).toBe(0);
  } finally {
    await page.close();
  }
}, 30_000);

it("keeps a pending Finish on screen through dismissal attempts, shows failure, and can retry", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    await page.goto(`${appUrl}#/phaseCompan10n/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    const { game, players } = await seedCompletionGame(page, 3);
    await seedSavedRound(page, game, players, false);
    await page.goto(`${appUrl}#/phaseCompan10n/game/${game.id}`);
    await page.getByRole("button", { name: "Finish Game", exact: true }).click();
    const finish = page.getByRole("dialog", { name: "Finish Game", exact: true });
    await page.evaluate(`
      import("/scorekeeper/src/data/api/games.ts").then(({ gamesApi }) => {
        const finish = gamesApi.finish;
        gamesApi.finish = async (id) => {
          gamesApi.finish = finish;
          await new Promise((resolve) => window.addEventListener("release-finish", resolve, { once: true }));
          return finish(id);
        };
      })
    `);
    await page.evaluate(() => {
      const put = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (value, key) {
        if (this.name === "games") {
          IDBObjectStore.prototype.put = put;
          throw new DOMException("Result write failed", "QuotaExceededError");
        }
        return put.call(this, value, key);
      };
    });
    await finish.getByRole("button", { name: "Finish", exact: true }).click();
    await finish.getByRole("button", { name: "Finishing...", exact: true }).waitFor();
    expect(
      await finish.getByRole("button", { name: "Finishing...", exact: true }).isDisabled(),
    ).toBe(true);
    expect(await finish.getByRole("button", { name: "Pause", exact: true }).isDisabled()).toBe(
      true,
    );
    await page.keyboard.press("Escape");
    const bounds = await finish.boundingBox();
    if (!bounds) throw new Error("Missing Finish panel");
    await page.mouse.click(10, 200);
    expect(await finish.isVisible()).toBe(true);
    expect(page.url()).toBe(`${appUrl}#/phaseCompan10n/game/${game.id}`);
    await page.evaluate(() => window.dispatchEvent(new Event("release-finish")));
    await finish.getByRole("alert").waitFor();
    expect(await finish.getByRole("alert").innerText()).toContain("Couldn't finish Game");
    expect(await readResults(page)).toMatchObject({ games: [{ id: game.id, status: "active" }] });
    expect(await readRounds(page, game.id)).toHaveLength(1);
    await page.keyboard.press("Escape");
    await finish.waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Finish Game", exact: true }).click();
    expect(await finish.getByRole("alert").count()).toBe(0);
    await finish.getByRole("button", { name: "Finish", exact: true }).click();
    await page.getByRole("tabpanel", { name: "Standings", exact: true }).waitFor();
    expect(await readResults(page)).toMatchObject({
      games: [{ id: game.id, status: "completed", winnerIds: [players[0].id] }],
    });
  } finally {
    await page.close();
  }
}, 30_000);

function seedCompletionGame(page: Page, phaseCount = 1, tiebreaker: GameTiebreaker = "roundsWon") {
  return page.evaluate<{ game: Game; players: Player[] }>(`
    Promise.all([
      import("/scorekeeper/src/data/api/games.ts"),
      import("/scorekeeper/src/data/api/players.ts")
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
          phases: ${JSON.stringify(Array.from({ length: phaseCount }, (_, index) => `phase-${index + 1}`))}
        },
        players: [amy.id, bob.id],
        settings: { tiebreaker: ${JSON.stringify(tiebreaker)}, roundSkipPenalty: 100, sitOutPenalty: 0 }
      });
      return { game, players: [amy, bob] };
    })
  `);
}

function seedSavedRound(page: Page, game: Game, players: Player[], tied: boolean) {
  return page.evaluate(`
    import("/scorekeeper/src/data/api/rounds.ts").then(({ roundsApi }) =>
      roundsApi.add({
        gameId: ${JSON.stringify(game.id)},
        roundWinnerId: ${JSON.stringify(players[0].id)},
        scores: [
          { playerId: ${JSON.stringify(players[0].id)}, phaseStatus: "completed", score: 0 },
          { playerId: ${JSON.stringify(players[1].id)}, phaseStatus: ${JSON.stringify(tied ? "completed" : "failed")}, score: ${tied ? 0 : 20} }
        ]
      })
    )
  `);
}

function readRounds(page: Page, gameId: string) {
  return page.evaluate(`
    import("/scorekeeper/src/data/api/rounds.ts").then(({ roundsApi }) =>
      roundsApi.getByGameId(${JSON.stringify(gameId)})
    )
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
      import("/scorekeeper/src/data/api/players.ts").then(({ playersApi }) =>
        playersApi.update(${JSON.stringify(renamedId)}, { name: "Zoe Quinn", color: "#654321" })
      ),
      import("/scorekeeper/src/data/api/players.ts").then(({ playersApi }) =>
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
      import("/scorekeeper/src/data/api/games.ts").then(({ gamesApi }) =>
        gamesApi.getAll()
      ),
      import("/scorekeeper/src/data/api/players.ts").then(({ playersApi }) =>
        playersApi.getAll()
      )
    ]).then(([games, players]) => ({ games, players }))
  `);
}
