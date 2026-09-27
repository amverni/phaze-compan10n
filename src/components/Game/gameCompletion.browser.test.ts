/// <reference types="node" />

import type { Browser, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { completionPlayers, makeActiveGame } from "../../data/api/gameCompletionTestFixtures";
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

it("opens final Standings after a finishing Round and retains only the individual Game result", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    const players = [completionPlayers.amy, completionPlayers.bob];
    const game = makeActiveGame({
      phaseSet: {
        id: "short-phases",
        type: "temporary",
        name: "One Phase",
        phases: ["phase-1"],
      },
      settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 0 },
    });
    await page.goto(`${appUrl}#/phaseCompan10n/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    await page.evaluate(
      ({ game, players }) =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.open("phase10-db");
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(["games", "players"], "readwrite");
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
          };
        }),
      { game, players },
    );
    await page.goto(`${appUrl}#/phaseCompan10n/game/${game.id}`);
    await page.getByRole("button", { name: "Add round 1", exact: true }).click();
    const entry = page.getByRole("dialog");
    await entry.getByRole("button", { name: /Round Winner/ }).click();
    await page.getByRole("option", { name: "Amy", exact: true }).click();
    await entry.getByRole("tab", { name: "Bob", exact: true }).click();
    await entry.getByRole("button", { name: "Failed", exact: true }).click();
    await entry.getByRole("button", { name: "Save round", exact: true }).click();

    const standings = page.getByRole("dialog").filter({
      has: page.getByRole("tab", { name: "Standings", exact: true }),
    });
    const results = standings.getByRole("tabpanel", { name: "Standings", exact: true });
    await results.waitFor();
    expect(await results.innerText()).toContain("Amy");
    expect(await results.innerText()).toContain("1 win");
    expect(await results.innerText()).toContain("0 wins");
    expect(await readResults(page)).toEqual({
      games: [
        expect.objectContaining({
          status: "completed",
          winnerId: "amy",
          winnerName: "Amy",
        }),
      ],
      players,
    });

    await page.keyboard.press("Escape");
    await standings.waitFor({ state: "detached" });
    expect(await page.getByRole("button", { name: /^Add round/ }).count()).toBe(0);
    await page.reload();
    await results.waitFor();
    expect(await readResults(page)).toMatchObject({ players });
  } finally {
    await page.close();
  }
}, 30_000);

function readResults(page: Page) {
  // Keep these imports in the browser rather than Vitest's SSR module loader.
  return page.evaluate<{ games: Game[]; players: Player[] }>(`
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
