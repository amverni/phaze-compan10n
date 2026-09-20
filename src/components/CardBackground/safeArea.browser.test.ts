/// <reference types="node" />

import type { Browser, Page } from "playwright";
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
  appUrl = `http://127.0.0.1:${address.port}/phase-10-scoreboard/`;
  browser = await webkit.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function openPage(height: number, colorScheme: "light" | "dark" = "light") {
  const page = await browser.newPage({
    viewport: { width: 390, height },
    colorScheme,
    hasTouch: true,
  });
  await page.goto(`${appUrl}#/create`);
  await page.getByRole("link", { name: "Cancel", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function bounds(page: Page, selector: string) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`Missing visible element: ${selector}`);
  return box;
}

async function readPixels(page: Page, x: number, y: number, width: number, height: number) {
  const screenshot = await page.screenshot();
  return page.evaluate(
    async ({ image, x, y, width, height }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${image}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Missing canvas context");
      context.drawImage(img, 0, 0);
      return Array.from(context.getImageData(x, y, width, height).data);
    },
    { image: screenshot.toString("base64"), x, y, width, height },
  );
}

describe("safe-area layout in WebKit", () => {
  it("keeps the full pressed footer control and shadow inside the footer at the height breakpoint", async () => {
    for (const height of [600, 700, 701, 900]) {
      const page = await openPage(height);
      try {
        const button = page.getByRole("link", { name: "Cancel", exact: true });
        const resting = await button.boundingBox();
        expect(resting?.width).toBe(height <= 700 ? 44 : 56);
        expect(resting?.height).toBe(resting?.width);

        await button.hover();
        await page.mouse.down();
        await expect
          .poll(async () => (await button.boundingBox())?.width)
          .toBeCloseTo((height <= 700 ? 44 : 56) * 1.1, 1);
        const pressed = await button.boundingBox();
        if (!pressed) throw new Error("Pressed button is not visible");
        const footer = await bounds(page, ".card-panel-bottom-content");
        // Leave space for the visible glass shadow, not just the scaled circle.
        expect(pressed.y - 15).toBeGreaterThanOrEqual(footer.y + 50);
        expect(pressed.y + pressed.height + 19).toBeLessThanOrEqual(height - 8);
        expect(pressed.x - 15).toBeGreaterThanOrEqual(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      } finally {
        await page.close();
      }
    }
  }, 60_000);

  it("reserves device insets and the larger dark-mode shadow without shrinking the tap target", async () => {
    const page = await openPage(701, "dark");
    try {
      // WebKit's desktop automation does not expose device cutouts. Supply the
      // same insets the browser normally provides through the layout variables.
      await page.addStyleTag({
        content: ":root { --safe-area-inset-bottom: 34px; --safe-area-inset-left: 44px; }",
      });
      const button = page.getByRole("link", { name: "Cancel", exact: true });
      await button.hover();
      await page.mouse.down();
      await expect.poll(async () => (await button.boundingBox())?.width).toBeCloseTo(61.6, 1);
      const pressed = await button.boundingBox();
      if (!pressed) throw new Error("Pressed button is not visible");
      const footer = await bounds(page, ".card-panel-bottom-content");
      expect(pressed.y - 38).toBeGreaterThanOrEqual(footer.y + 50);
      expect(pressed.y + pressed.height + 55).toBeLessThanOrEqual(701 - 34 - 8);
      expect(pressed.x - 47).toBeGreaterThanOrEqual(44);
    } finally {
      await page.close();
    }
  }, 30_000);

  it("paints faded stripes through the side safe area without moving logo text or header controls", async () => {
    const page = await openPage(700);
    try {
      await page.addStyleTag({
        content: ":root { --safe-area-inset-top: 47px; --safe-area-inset-left: 44px; }",
      });
      const logo = await page.getByRole("img", { name: "Phaze Compan10n" }).boundingBox();
      expect(logo).toEqual({ x: 44, y: 36.5, width: 346, height: 100 });
      const tips = await page.getByRole("button", { name: "Tips" }).boundingBox();
      expect(tips).toEqual({ x: 334, y: 54.5, width: 40, height: 40 });

      const pixels = await readPixels(page, 20, 0, 1, 152);
      const colorfulPixels = pixels.filter((red, index) => {
        if (index % 4 !== 0) return false;
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        return Math.max(red, green, blue) - Math.min(red, green, blue) > 35;
      });
      expect(colorfulPixels.length).toBeGreaterThan(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
      await page.getByRole("button", { name: "Tips" }).click();
    } finally {
      await page.close();
    }
  }, 30_000);

  it("keeps the dialog's glass continuous below the viewport during dragging without extending content", async () => {
    const page = await openPage(700);
    try {
      await page.addStyleTag({
        content: ":root { --safe-area-inset-bottom: 34px; }",
      });
      await page.getByRole("button", { name: "Add Player", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Add player", exact: true });
      await dialog.waitFor({ state: "attached" });
      await expect.poll(async () => (await bounds(page, ".dialog-glass")).y).toBe(141);
      const surface = await bounds(page, ".dialog-glass");
      expect(surface.width).toBe(351);
      expect(surface.y + surface.height).toBeGreaterThanOrEqual(1400);
      const content = await dialog.locator("section").boundingBox();
      if (!content) throw new Error("Missing dialog content");
      expect(content.y + content.height).toBeLessThanOrEqual(666);
      expect(
        await page
          .locator(".dialog-glass")
          .evaluate((element) => getComputedStyle(element).pointerEvents),
      ).toBe("none");

      // Drag the visible handle, first stretching upward, then below dismissal threshold.
      await page.mouse.move(195, surface.y + 14);
      await page.mouse.down();
      await page.mouse.move(195, surface.y - 26, { steps: 4 });
      expect((await bounds(page, ".dialog-glass")).y).toBeLessThan(surface.y);
      await page.mouse.move(195, surface.y + 94, { steps: 4 });
      const dragged = await bounds(page, ".dialog-glass");
      expect(dragged.y).toBeCloseTo(surface.y + 80, 1);
      expect(dragged.y + dragged.height).toBeGreaterThan(1400);
      await page.mouse.up();
      await expect.poll(async () => (await bounds(page, ".dialog-glass")).y).toBe(141);
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      await expect
        .poll(async () =>
          page
            .getByRole("button", { name: "Add Player", exact: true })
            .evaluate((element) => element === document.activeElement),
        )
        .toBe(true);
    } finally {
      await page.close();
    }
  }, 30_000);

  it("keeps rows exposed above the footer diagonal tappable while footer controls still work", async () => {
    const page = await openPage(600);
    try {
      await page.goto(`${appUrl}#/phases`);
      await page.getByRole("tab", { name: "Phases", exact: true }).click();
      await page.getByText("1 run of 9", { exact: true }).waitFor();
      // The right end of the same row is hidden by the painted footer.
      await page.mouse.click(300, 480);
      expect(await page.getByRole("dialog").count()).toBe(0);
      // This visible part of the row lies inside the footer's rectangular bounds,
      // but outside its painted diagonal. A transparent layer must not catch it.
      await page.mouse.click(40, 480);
      const dialog = page.getByRole("dialog", { name: "1 run of 9", exact: true });
      await expect.poll(() => dialog.count()).toBe(1);
      await dialog.getByRole("button", { name: "Go back" }).click();
      await dialog.waitFor({ state: "detached" });
      await page.getByRole("link", { name: "Go home", exact: true }).click();
      await page.getByRole("link", { name: "Create Game", exact: true }).waitFor();
    } finally {
      await page.close();
    }
  }, 30_000);
});
