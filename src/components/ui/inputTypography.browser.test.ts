/// <reference types="node" />

import type { Browser, Locator } from "playwright";
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

async function openPlayersPage(width: number) {
  const page = await browser.newPage({
    viewport: { width, height: 844 },
    hasTouch: width < 768,
  });
  await page.goto(`${appUrl}#/phaseCompan10n/players`);
  await page.getByPlaceholder(/^Search players/).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function expectReadableInput(input: Locator, viewportWidth: number) {
  expect(
    await input.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await input.fill("A player with a long name");
  expect(await input.inputValue()).toBe("A player with a long name");
  expect(
    await input.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  const box = await input.boundingBox();
  if (!box) throw new Error("Input is not visible");
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth);
}

describe.each([320, 390, 1280])("input typography at %ipx viewport width", (width) => {
  it("uses readable search text without changing the compact control or viewport settings", async () => {
    const page = await openPlayersPage(width);
    try {
      const search = page.getByPlaceholder(/^Search players/);
      await expectReadableInput(search, width);
      expect((await search.locator("..").boundingBox())?.height).toBe(36);
      expect(await page.locator('meta[name="viewport"]').getAttribute("content")).toBe(
        "width=device-width, initial-scale=1.0, viewport-fit=cover",
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    } finally {
      await page.close();
    }
  }, 30_000);

  it("uses readable name-entry text without enlarging its label", async () => {
    const page = await openPlayersPage(width);
    try {
      await page.getByRole("button", { name: "Create new player" }).click();
      const dialog = page.getByRole("dialog", { name: "Create player", exact: true });
      const input = dialog.getByRole("textbox", { name: "Name", exact: true });
      await input.waitFor();
      await expectReadableInput(input, width);
      expect(
        await dialog
          .locator("label", { hasText: "Name" })
          .evaluate((element) => getComputedStyle(element).fontSize),
      ).toBe("14px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    } finally {
      await page.close();
    }
  }, 30_000);
});
