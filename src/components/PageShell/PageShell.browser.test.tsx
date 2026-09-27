/// <reference types="node" />

import type { Browser } from "playwright";
import { webkit } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

describe.each(["light", "dark"] as const)("neutral page layout in %s mode", (colorScheme) => {
  it("has no slant spacing and keeps scrolling content and pressed controls inside Safe Areas", async () => {
    for (const [width, height] of [
      [320, 568],
      [844, 390],
      [1280, 900],
    ]) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme });
      try {
        await page.goto(appUrl);
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
