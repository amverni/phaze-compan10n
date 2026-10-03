/// <reference types="node" />

import type { Browser } from "playwright";
import { webkit } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { GameId } from "../../types";
import { Button } from "../ui";
import { PageShell } from "./PageShell";

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

describe("Scorekeeper shell geometry", () => {
  it("places the flat header edge at the Phase slant midpoint", async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
      await page.goto(`${appUrl}#/phaseCompan10n/create`);
      await page.getByRole("link", { name: "Cancel", exact: true }).waitFor();
      const phaseHeader = await page.locator(".page-shell-header").boundingBox();
      expect(phaseHeader?.height).toBeCloseTo(126.6, 1);

      await page.goto(`${appUrl}#/create`);
      await page.getByRole("img", { name: "Scorekeeper", exact: true }).waitFor();
      const header = await page.locator(".page-shell-header").boundingBox();
      const main = await page.locator(".page-shell-main").boundingBox();
      expect(header?.height).toBeCloseTo(101.6, 1);
      expect(main?.y).toBeCloseTo(101.6, 1);
    } finally {
      await page.close();
    }
  }, 30_000);

  it("fits the footer around its controls with 12px above and below", async () => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
      await page.goto(`${appUrl}#/create`);
      const cancel = page.getByRole("link", { name: "Cancel", exact: true });
      await cancel.waitFor();
      const footer = await page.locator(".page-shell-footer").boundingBox();
      const control = await cancel.boundingBox();
      const main = await page.locator(".page-shell-main").boundingBox();
      if (!footer || !control || !main) throw new Error("Missing shell regions");
      expect(footer.height).toBe(80);
      expect(control.height).toBe(56);
      expect(control.y - footer.y).toBe(12);
      expect(footer.y + footer.height - control.y - control.height).toBe(12);
      expect(main.height).toBeCloseTo(662.4, 1);
      expect(main.y + main.height).toBe(footer.y);
    } finally {
      await page.close();
    }
  }, 30_000);
});

describe.each(["light", "dark"] as const)("generic page layout in %s mode", (colorScheme) => {
  it.each([
    { width: 390, height: 844 },
    { width: 390, height: 700 },
    { width: 390, height: 701 },
    { width: 320, height: 568 },
    { width: 844, height: 390 },
    { width: 1280, height: 900 },
  ])("recovers main content space and contains controls at $width x $height", async ({
    width,
    height,
  }) => {
    const page = await browser.newPage({
      viewport: { width, height },
      colorScheme,
      hasTouch: width < 1024,
    });
    try {
      await page.goto(appUrl);
      await page.getByRole("button", { name: "Menu", exact: true }).waitFor();
      const gameId = await page.evaluate<GameId>(`(async () => {
        const { playersApi } = await import("/phase-10-scoreboard/src/data/api/players.ts");
        const { genericGamesApi } = await import("/phase-10-scoreboard/src/data/api/genericGames.ts");
        const player = await playersApi.create({
          name: "Maya", color: "#123456", isFavorite: 0,
        });
        const game = await genericGamesApi.create({
          players: [player.id],
          settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
        });
        return game.id;
      })()`);

      for (const route of [
        "/",
        "/create",
        `/game/${gameId}`,
        "/players",
        "/games",
        "/scorekeepers",
      ]) {
        await page.goto(`${appUrl}#${route}`);
        await page.locator(".scorekeeper-background").waitFor();
        if (route === `/game/${gameId}`) {
          await page.getByRole("region", { name: "Scoreboard", exact: true }).waitFor();
        }
        await page.evaluate(() => document.fonts.ready);

        for (const insets of [
          { top: 0, bottom: 0, left: 0, right: 0 },
          { top: 47, bottom: 34, left: 44, right: 44 },
        ]) {
          await page.evaluate((insets) => {
            for (const [edge, value] of Object.entries(insets)) {
              document.documentElement.style.setProperty(`--safe-area-inset-${edge}`, `${value}px`);
            }
          }, insets);
          const header = await page.locator(".page-shell-header").boundingBox();
          const main = await page.locator(".page-shell-main").boundingBox();
          const footer = await page.locator(".page-shell-footer").boundingBox();
          if (!header || !main || !footer) throw new Error(`Missing shell regions on ${route}`);
          const size = height <= 700 ? 44 : 56;
          expect(header.height, route).toBeCloseTo(
            Math.max(height * 0.15 - 25, 64) + insets.top,
            1,
          );
          expect(footer.height, route).toBe(size + 24 + insets.bottom);
          expect(main.y, route).toBeCloseTo(header.y + header.height, 1);
          expect(main.y + main.height, route).toBeCloseTo(footer.y, 1);
          expect(footer.y + footer.height, route).toBeCloseTo(height, 1);
          expect(main.height, route).toBeGreaterThan(0);
          expect(
            await page.locator(".page-shell-main").evaluate((element) => {
              const style = getComputedStyle(element);
              return [style.paddingTop, style.marginTop, style.marginBottom];
            }),
          ).toEqual(["0px", "0px", "0px"]);
          expect(await page.locator(".card-panel-disclaimer").count()).toBe(0);
          const headerContent = await page.locator(".page-shell-header > *").boundingBox();
          if (!headerContent) throw new Error(`Missing header content on ${route}`);
          expect(headerContent.y).toBeGreaterThanOrEqual(insets.top);
          expect(headerContent.y + headerContent.height).toBeLessThanOrEqual(main.y);
          for (const content of await page
            .locator(".page-shell-header :is(button, svg[role=img])")
            .all()) {
            const box = await content.boundingBox();
            if (!box) throw new Error(`Missing header control or logo on ${route}`);
            expect(box.y).toBeGreaterThanOrEqual(insets.top);
            expect(box.y + box.height).toBeLessThanOrEqual(main.y);
          }

          const controls = page.locator(".page-shell-footer :is(button, a)");
          expect(await controls.count()).toBe(
            route === "/create" || route === `/game/${gameId}` ? 2 : 1,
          );
          for (const control of await controls.all()) {
            const resting = await control.boundingBox();
            if (!resting) throw new Error(`Missing footer control on ${route}`);
            expect(resting.height).toBe(size);
            expect(resting.width).toBe(size);
            expect(resting.y - footer.y).toBe(12);
            expect(height - insets.bottom - resting.y - resting.height).toBeCloseTo(12, 1);
            if (!(await control.isEnabled())) continue;
            const isAnchoredFlag = (await control.getAttribute("aria-label")) === "Finish Game";
            const pressSurface = isAnchoredFlag ? control.locator(":scope > .glass") : control;
            await control.focus();
            expect(await control.evaluate((element) => document.activeElement === element)).toBe(
              true,
            );
            await control.hover();
            await page.mouse.down();
            await expect
              .poll(async () => (await pressSurface.boundingBox())?.width)
              .toBeCloseTo(size * 1.1, 1);
            if (isAnchoredFlag) expect(await control.boundingBox()).toEqual(resting);
            const pressed = await pressSurface.boundingBox();
            if (!pressed) throw new Error(`Missing pressed control on ${route}`);
            expect(pressed.x).toBeGreaterThanOrEqual(insets.left);
            expect(pressed.x + pressed.width).toBeLessThanOrEqual(width - insets.right);
            expect(pressed.y).toBeGreaterThanOrEqual(footer.y);
            expect(pressed.y + pressed.height).toBeLessThanOrEqual(height - insets.bottom);
            // Release outside the control so navigation and dialogs do not change the page.
            await page.mouse.move(0, 0);
            await page.mouse.up();
            await expect.poll(async () => (await pressSurface.boundingBox())?.width).toBe(size);
          }
          const bleed = await page.locator(".page-shell-bottom-bleed").boundingBox();
          expect(bleed?.y).toBeCloseTo(height, 1);
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        }
      }
    } finally {
      await page.close();
    }
  }, 60_000);
});

describe.each(["light", "dark"] as const)("neutral page layout in %s mode", (colorScheme) => {
  it("has no slant spacing and keeps scrolling content and pressed controls inside Safe Areas", async () => {
    for (const [width, height] of [
      [320, 568],
      [844, 390],
      [1280, 900],
    ]) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme });
      try {
        await page.goto(`${appUrl}#/phaseCompan10n`);
        await page.getByRole("link", { name: "Create Game" }).waitFor();
        const markup = renderToStaticMarkup(
          <PageShell
            headerContent={<h1 className="content-container">Scorekeeper</h1>}
            mainContent={
              <div className="content-container">
                <p>First entry</p>
                <div style={{ height: 1200 }} />
                <Button>Last entry</Button>
              </div>
            }
            footerContent={
              <div className="content-container flex h-full items-center justify-between">
                {["Back", "Finish"].map((label) => (
                  <Button
                    key={label}
                    style={{
                      width: "var(--page-shell-footer-control-size)",
                      height: "var(--page-shell-footer-control-size)",
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            }
          />,
        );
        await page.evaluate((html) => {
          const host = document.createElement("div");
          host.id = "neutral-shell";
          host.style.cssText =
            "position:fixed;inset:0;z-index:100;background:var(--color-app-background)";
          host.innerHTML = html;
          document.body.appendChild(host);
        }, markup);
        await page.addStyleTag({
          content:
            ":root { --safe-area-inset-top: 47px; --safe-area-inset-bottom: 34px; --safe-area-inset-left: 44px; --safe-area-inset-right: 44px; }",
        });
        const host = page.locator("#neutral-shell");
        const header = await host.locator(".page-shell-header").boundingBox();
        const main = await host.locator(".page-shell-main").boundingBox();
        const footer = await host.locator(".page-shell-footer").boundingBox();
        if (!header || !main || !footer) throw new Error("Missing shell regions");
        expect(header.height).toBeCloseTo(height * 0.15 + 47, 1);
        expect(main.y).toBeCloseTo(header.y + header.height, 1);
        expect(main.y + main.height).toBeCloseTo(footer.y, 1);
        expect(footer.y + footer.height).toBeCloseTo(height, 1);
        expect(await host.getByText("Scorekeeper", { exact: true }).boundingBox()).toMatchObject({
          y: 47,
        });
        expect(
          await host.locator(".page-shell-main").evaluate((element) => {
            const style = getComputedStyle(element);
            return [style.paddingTop, style.marginTop, style.marginBottom, style.clipPath];
          }),
        ).toEqual(["0px", "0px", "0px", "none"]);
        expect(await host.getByText("Mattel", { exact: false }).count()).toBe(0);

        const lastEntry = host.getByRole("button", { name: "Last entry" });
        await lastEntry.scrollIntoViewIfNeeded();
        const lastEntryBox = await lastEntry.boundingBox();
        if (!lastEntryBox) throw new Error("Missing last entry");
        expect(lastEntryBox.y).toBeGreaterThanOrEqual(main.y);
        // WebKit scroll offsets round to whole pixels even when the panel height is fractional.
        expect(lastEntryBox.y + lastEntryBox.height - footer.y).toBeLessThan(1);

        for (const label of ["Back", "Finish"]) {
          const control = host.getByRole("button", { name: label, exact: true });
          await control.focus();
          expect(await control.evaluate((element) => document.activeElement === element)).toBe(
            true,
          );
          await control.hover();
          await page.mouse.down();
          const size = height <= 700 ? 44 : 56;
          await expect
            .poll(async () => (await control.boundingBox())?.width)
            .toBeCloseTo(size * 1.1, 1);
          const pressed = await control.boundingBox();
          if (!pressed) throw new Error("Missing pressed control");
          expect(pressed.x).toBeGreaterThanOrEqual(44);
          expect(pressed.x + pressed.width).toBeLessThanOrEqual(width - 44);
          expect(pressed.y).toBeGreaterThanOrEqual(footer.y);
          expect(pressed.y + pressed.height).toBeLessThanOrEqual(height - 34);
          await page.mouse.up();
        }
        const bleed = await host.locator(".page-shell-bottom-bleed").boundingBox();
        expect(bleed?.y).toBeCloseTo(height, 1);
        expect(bleed?.height).toBeGreaterThanOrEqual(height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      } finally {
        await page.close();
      }
    }
  }, 60_000);
});
