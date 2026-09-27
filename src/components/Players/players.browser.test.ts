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
  appUrl = `http://127.0.0.1:${address.port}/phase-10-scoreboard/`;
  browser = await webkit.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

it("manages saved Players without displaying or writing lifetime Win Counts", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    await page.goto(`${appUrl}#/players`);
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

function readPlayers(page: Page) {
  // Keep this import in the browser rather than Vitest's SSR module loader.
  return page.evaluate<Player[]>(`
    import("/phase-10-scoreboard/src/data/api/players.ts").then(({ playersApi }) =>
      playersApi.getAll()
    )
  `);
}
