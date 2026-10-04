/// <reference types="node" />

import type { Browser } from "playwright";
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

describe.each(["light", "dark"] as const)("Scorekeeper logo in %s mode", (colorScheme) => {
  it("centers the stripe band on the loaded word including its descender without moving the lettering", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme,
      timezoneId: "America/New_York",
    });
    await page.clock.setFixedTime(new Date("2026-10-06T16:00:00Z"));
    try {
      for (const route of ["/scorekeeper", "/scorekeeper/players", "/"]) {
        await page.goto(`${appUrl}#${route}`);
        const logo = page.getByRole("img", { name: "Scorekeeper", exact: true });
        await logo.waitFor();
        const geometry = await logo.evaluate(async (element) => {
          const text = element.querySelector("text");
          if (!text) throw new Error("Missing Scorekeeper lettering");
          const style = getComputedStyle(text);
          const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const faces = await document.fonts.load(font, "Scorekeeper");
          await document.fonts.ready;
          const context = document.createElement("canvas").getContext("2d");
          if (!context) throw new Error("Missing font measurement context");
          context.font = font;
          const metrics = context.measureText("Scorekeeper");
          const transform = text.getScreenCTM();
          if (!transform) throw new Error("Missing lettering transform");
          const inkCenter = new DOMPoint(
            280,
            79 + (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2,
          ).matrixTransform(transform);
          const stripes = [...element.querySelectorAll("rect")].map((stripe) =>
            stripe.getBoundingClientRect(),
          );
          if (stripes.length !== 4) throw new Error("Missing Scorekeeper stripes");
          return {
            loaded: faces.length > 0 && faces.every((face) => face.status === "loaded"),
            descender: metrics.actualBoundingBoxDescent,
            inkCenter: inkCenter.y,
            stripeCenter: (stripes[0].top + stripes[3].bottom) / 2,
            bandHeight: (stripes[3].bottom - stripes[0].top) / transform.d,
            text: text.textContent,
            x: text.getAttribute("x"),
            y: text.getAttribute("y"),
            anchor: text.getAttribute("text-anchor"),
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            strokeWidth: style.strokeWidth,
            fill: style.fill,
            stroke: style.stroke,
          };
        });
        expect(geometry.loaded).toBe(true);
        expect(geometry.descender).toBeGreaterThan(0);
        expect(geometry).toMatchObject({
          text: "Scorekeeper",
          x: "280",
          y: "79",
          anchor: "middle",
          fontSize: "72px",
          fontWeight: "600",
          letterSpacing: "2px",
          strokeWidth: "12px",
        });
        expect(geometry.fill).not.toBe(geometry.stroke);
        expect(geometry.bandHeight).toBeCloseTo(66, 3);
        expect(Math.abs(geometry.stripeCenter - geometry.inkCenter)).toBeLessThan(0.1);
      }
    } finally {
      await page.close();
    }
  }, 60_000);

  it("bleeds straight noninteractive stripes to both viewport edges across resizing and Safe Areas", async () => {
    const page = await browser.newPage({ colorScheme, timezoneId: "America/New_York" });
    await page.clock.setFixedTime(new Date("2026-10-06T16:00:00Z"));
    try {
      for (const route of ["/scorekeeper", "/scorekeeper/players"]) {
        await page.goto(`${appUrl}#${route}`);
        const logo = page.getByRole("img", { name: "Scorekeeper", exact: true });
        await logo.waitFor();
        await page.evaluate(() => document.fonts.ready);
        for (const [width, height, left, right] of [
          [390, 844, 0, 0],
          [844, 390, 44, 0],
          [390, 844, 0, 0],
          [1280, 900, 0, 0],
          [1920, 1080, 0, 0],
          [320, 568, 44, 44],
        ]) {
          await page.setViewportSize({ width, height });
          await page.evaluate(
            ({ left, right }) => {
              document.documentElement.style.setProperty("--safe-area-inset-left", `${left}px`);
              document.documentElement.style.setProperty("--safe-area-inset-right", `${right}px`);
            },
            { left, right },
          );
          await expect
            .poll(
              () =>
                logo.locator("rect").evaluateAll((elements) =>
                  elements.every((element) => {
                    const box = element.getBoundingClientRect();
                    return Math.abs(box.left) < 0.1 && Math.abs(box.right - innerWidth) < 0.1;
                  }),
                ),
              { message: `${route} stripes at ${width}x${height}, Safe Areas ${left}/${right}` },
            )
            .toBe(true);
          const stripes = await logo.locator("rect").evaluateAll((elements) =>
            elements.map((element) => {
              const box = element.getBoundingClientRect();
              return {
                y: box.top + box.height / 2,
                pointerEvents: getComputedStyle(element).pointerEvents,
              };
            }),
          );
          expect(stripes).toHaveLength(4);
          expect(stripes.every((stripe) => stripe.pointerEvents === "none")).toBe(true);
          const screenshot = await page.screenshot();
          const pixels = await page.evaluate(
            async ({ image, stripes, width }) => {
              const img = new Image();
              img.src = `data:image/png;base64,${image}`;
              await img.decode();
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const context = canvas.getContext("2d");
              if (!context) throw new Error("Missing screenshot context");
              context.drawImage(img, 0, 0);
              return stripes.map(({ y }) =>
                [0, width - 1].map((x) =>
                  Array.from(context.getImageData(x, Math.floor(y), 1, 1).data),
                ),
              );
            },
            { image: screenshot.toString("base64"), stripes, width },
          );
          expect(pixels).toEqual([
            [
              [37, 99, 235, 255],
              [37, 99, 235, 255],
            ],
            [
              [6, 182, 212, 255],
              [6, 182, 212, 255],
            ],
            [
              [139, 92, 246, 255],
              [139, 92, 246, 255],
            ],
            [
              [236, 72, 153, 255],
              [236, 72, 153, 255],
            ],
          ]);
          expect(
            await page
              .locator(route === "/scorekeeper" ? "html, body, .page-shell-main" : "html, body")
              .evaluateAll((elements) =>
                elements.every((element) => element.scrollWidth <= element.clientWidth),
              ),
          ).toBe(true);
        }
      }
    } finally {
      await page.close();
    }
  }, 60_000);
});
