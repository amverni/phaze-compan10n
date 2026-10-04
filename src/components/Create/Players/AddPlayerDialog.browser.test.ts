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

async function waitForSlide(slider: Locator) {
  await slider.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
  });
}

describe.each(["/scorekeeper/create", "/phaseCompan10n/create"])("%s", (route) => {
  describe.each([
    { width: 390, height: 844 },
    { width: 1280, height: 900 },
  ])("Player page transitions at $width px", (viewport) => {
    it.each([
      "no-preference",
      "reduce",
    ] as const)("keeps the focused Player form aligned with reduced motion set to %s", async (reducedMotion) => {
      const page = await browser.newPage({ viewport, hasTouch: true, reducedMotion });
      try {
        await page.goto(`${appUrl}#${route}`);
        await page.getByRole("button", { name: "Add Player", exact: true }).tap();
        const dialog = page.getByRole("dialog");
        const slider = dialog.locator(".add-player-slider");
        const search = dialog.getByRole("textbox");
        await search.fill("Amy");

        for (let attempt = 0; attempt < 3; attempt++) {
          await dialog.getByRole("button", { name: "Create new player", exact: true }).tap();
          const name = dialog.getByRole("textbox", { name: "Name", exact: true });
          await name.waitFor();
          await waitForSlide(slider);

          const panelBounds = await dialog.locator(".dialog-panel").boundingBox();
          const nameBounds = await name.boundingBox();
          const back = dialog.getByRole("button", { name: "Back to search" });
          const backBounds = await back.boundingBox();
          if (!panelBounds || !nameBounds || !backBounds) {
            throw new Error("Missing Player form bounds");
          }
          expect(backBounds.x).toBeGreaterThanOrEqual(panelBounds.x);
          expect(nameBounds.x).toBeGreaterThanOrEqual(panelBounds.x);
          expect(nameBounds.x + nameBounds.width).toBeLessThanOrEqual(
            panelBounds.x + panelBounds.width,
          );
          expect(
            Math.abs(nameBounds.x + nameBounds.width / 2 - (panelBounds.x + panelBounds.width / 2)),
          ).toBeLessThanOrEqual(1);
          expect(await name.evaluate((element) => element === document.activeElement)).toBe(true);
          expect(await name.inputValue()).toBe("Amy");

          await back.tap();
          await slider.and(dialog.locator("[data-view='search']")).waitFor({ state: "attached" });
          await waitForSlide(slider);
          await expect
            .poll(() => search.evaluate((element) => element === document.activeElement))
            .toBe(true);
          const searchBounds = await search.boundingBox();
          if (!searchBounds) throw new Error("Missing Player search bounds");
          expect(searchBounds.x).toBeGreaterThanOrEqual(panelBounds.x);
          expect(searchBounds.x + searchBounds.width).toBeLessThanOrEqual(
            panelBounds.x + panelBounds.width,
          );
          expect(await search.inputValue()).toBe("Amy");
        }
      } finally {
        await page.close();
      }
    }, 30_000);
  });
});
