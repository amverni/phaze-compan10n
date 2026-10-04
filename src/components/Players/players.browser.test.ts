/// <reference types="node" />

import type { Browser, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { Player } from "../../types";

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

it("manages saved Players without displaying or writing lifetime Win Counts", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    await page.goto(`${appUrl}#/scorekeeper/players`);
    await page.getByRole("button", { name: "Create new player" }).click();
    const createDialog = page.getByRole("dialog", { name: "Create player", exact: true });
    await createDialog.getByRole("textbox", { name: "Name", exact: true }).fill("Amy");
    expect(await createDialog.innerText()).not.toMatch(/\bwins?\b/i);
    await createDialog.getByRole("button", { name: "Save", exact: true }).click();
    await createDialog.waitFor({ state: "detached" });
    const [created] = await readPlayers(page);
    expect(created).toMatchObject({ name: "Amy", isFavorite: 0 });
    expect(created).not.toHaveProperty("wins");

    await page.getByRole("button", { name: "Add Amy to favorites", exact: true }).click();
    await expect.poll(async () => (await readPlayers(page))[0]?.isFavorite).toBe(1);
    await page.getByRole("button", { name: "Amy", exact: true }).click();
    const editDialog = page.getByRole("dialog", { name: "Edit player", exact: true });
    await editDialog.getByRole("textbox", { name: "Name", exact: true }).fill("Amelia");
    expect(await editDialog.innerText()).not.toMatch(/\bwins?\b/i);
    await editDialog.getByRole("button", { name: "Save", exact: true }).click();
    await editDialog.waitFor({ state: "detached" });
    expect(await readPlayers(page)).toEqual([{ ...created, name: "Amelia", isFavorite: 1 }]);

    await page.reload();
    await page.getByRole("button", { name: "Amelia", exact: true }).waitFor();
    expect(await page.locator("body").innerText()).not.toMatch(/\bwins?\b/i);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Amelia", exact: true }).click();
    await page.getByText("No players yet", { exact: true }).waitFor();
    expect(await readPlayers(page)).toEqual([]);
  } finally {
    await page.close();
  }
}, 30_000);

it("keeps the Player row visible with an alert when an Active Game blocks deletion", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${appUrl}#/scorekeeper/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    await seedPlayersWithActiveGame(page);

    await page.goto(`${appUrl}#/scorekeeper/players`);
    await page.getByRole("button", { name: "Amy", exact: true }).waitFor();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Amy", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({
        hasText: "Cannot delete this Player while an Active Game references them.",
      })
      .waitFor({ timeout: 3_000 });
    expect((await readPlayers(page)).map((player) => player.name)).toEqual(["Amy", "Bob"]);
    const alertBounds = await page.getByRole("alert").boundingBox();
    const bobBounds = await page.getByRole("button", { name: "Bob", exact: true }).boundingBox();
    if (!alertBounds || !bobBounds) throw new Error("Missing deletion error or Player row");
    expect(alertBounds.y + alertBounds.height).toBeLessThanOrEqual(bobBounds.y);
    expect(pageErrors).toEqual([]);
  } finally {
    await page.close();
  }
}, 30_000);

it("keeps the Player editor open with an alert when an Active Game blocks deletion", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${appUrl}#/scorekeeper/players`);
    await page.getByText("No players yet", { exact: true }).waitFor();
    await seedPlayersWithActiveGame(page);
    await page.reload();
    await page.getByRole("button", { name: "Amy", exact: true }).waitFor({ timeout: 3_000 });

    await page.getByRole("button", { name: "Amy", exact: true }).click({ timeout: 3_000 });
    const editDialog = page.getByRole("dialog", { name: "Edit player", exact: true });
    await editDialog.waitFor({ state: "attached", timeout: 3_000 });
    page.once("dialog", (dialog) => dialog.accept());
    await editDialog.getByRole("button", { name: "Delete player", exact: true }).click();
    await editDialog
      .getByRole("alert")
      .filter({
        hasText: "Cannot delete this Player while an Active Game references them.",
      })
      .waitFor({ timeout: 3_000 });
    expect(await editDialog.count()).toBe(1);
    expect((await readPlayers(page)).map((player) => player.name)).toEqual(["Amy", "Bob"]);
    expect(pageErrors).toEqual([]);
  } finally {
    await page.close();
  }
}, 30_000);

function seedPlayersWithActiveGame(page: Page) {
  return page.evaluate(`
    Promise.all([
      import("/scorekeeper/src/data/api/games.ts"),
      import("/scorekeeper/src/data/api/players.ts")
    ]).then(async ([{ gamesApi }, { playersApi }]) => {
      const amy = await playersApi.create({ name: "Amy", color: "#123456", isFavorite: 0 });
      const bob = await playersApi.create({ name: "Bob", color: "#abcdef", isFavorite: 0 });
      await gamesApi.create({
        scorekeeper: "phase10",
        phaseSet: {
          id: "blocked-delete-phases",
          type: "temporary",
          name: "Blocked delete",
          phases: ["phase-1"]
        },
        players: [amy.id, bob.id],
        settings: { tiebreaker: "lowestPoints", roundSkipPenalty: 100, sitOutPenalty: 0 }
      });
    })
  `);
}

function readPlayers(page: Page) {
  // Keep this import in the browser rather than Vitest's SSR module loader.
  return page.evaluate<Player[]>(`
    import("/scorekeeper/src/data/api/players.ts").then(({ playersApi }) =>
      playersApi.getAll()
    )
  `);
}
