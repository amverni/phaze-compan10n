/// <reference types="node" />

import type { Browser, Page } from "playwright";
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
  appUrl = `http://127.0.0.1:${address.port}/scorekeeper/`;
  browser = await webkit.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function createPlayer(page: Page, name: string) {
  await page.getByRole("button", { name: "Add Player", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill(name);
  await dialog.getByRole("button", { name: "Create new player", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Name", exact: true }).waitFor();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await dialog.getByRole("heading", { name: "New Player", exact: true }).waitFor({
    state: "hidden",
  });
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
}

it("treats zero selected Players as normal setup and can start a Generic Game after reselecting one", async () => {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  page.setDefaultNavigationTimeout(60_000);
  try {
    await page.goto(`${appUrl}#/scorekeeper/create`);
    const start = page.getByRole("button", { name: "Start", exact: true });
    await start.waitFor();
    expect(await start.isDisabled()).toBe(true);
    expect(await page.getByRole("alert").count()).toBe(0);

    await createPlayer(page, "Amy");
    await expect.poll(() => start.isEnabled()).toBe(true);
    await createPlayer(page, "Bob");

    await page.getByRole("button", { name: "Remove Amy", exact: true }).click();
    await expect.poll(() => start.isEnabled()).toBe(true);
    const removeBob = page.getByRole("button", { name: "Remove Bob", exact: true });
    await removeBob.click();
    await removeBob.waitFor({ state: "hidden" });
    await expect.poll(() => start.isDisabled()).toBe(true);
    expect(await page.getByRole("alert").count()).toBe(0);

    await page.getByRole("button", { name: "Add Player", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox").fill("Amy");
    await dialog.getByRole("button", { name: /Amy/ }).click();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await expect.poll(() => start.isEnabled()).toBe(true);
    expect(await page.getByRole("alert").count()).toBe(0);
    await start.click();

    await page.waitForURL(/#\/scorekeeper\/game\/[^/]+$/);
    await page.getByRole("button", { name: "Add Round", exact: true }).waitFor();
    await page.getByRole("cell", { name: "Amy, upcoming Round", exact: true }).waitFor();
  } finally {
    await page.close();
  }
}, 90_000);
