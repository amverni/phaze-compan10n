/// <reference types="node" />

import type { Browser, Locator } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

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

function focusAppearance(control: Locator) {
  return control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      focused: document.activeElement === element,
      focusVisible: element.matches(":focus-visible"),
      checked: element.getAttribute("aria-checked") === "true",
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
    };
  });
}

describe.each([
  "light",
  "dark",
] as const)("score direction keyboard focus in %s mode", (colorScheme) => {
  it.each([
    "Points Direction",
    "Tiebreaker Direction",
  ] as const)("visibly outlines only the keyboard-focused %s option", async (label) => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme,
    });
    page.setDefaultTimeout(5_000);
    page.setDefaultNavigationTimeout(30_000);
    try {
      await page.goto(`${appUrl}#/create`);
      await page.getByRole("tab", { name: "Settings", exact: true }).click();
      const enable = page.getByRole("switch", { name: "Enable Tiebreaker", exact: true });
      await enable.click();
      const group = page.getByRole("radiogroup", { name: label, exact: true });
      const high = group.getByRole("radio", { name: "High wins", exact: true });
      const low = group.getByRole("radio", { name: "Low wins", exact: true });
      await group.waitFor();

      expect(await focusAppearance(high)).toMatchObject({
        focused: false,
        checked: true,
        outlineStyle: "none",
      });
      expect(await focusAppearance(low)).toMatchObject({
        focused: false,
        checked: false,
        outlineStyle: "none",
      });

      await enable.focus();
      await page.keyboard.press(label === "Points Direction" ? "Shift+Tab" : "Tab");
      const visibleFocus = {
        focused: true,
        focusVisible: true,
        checked: true,
        outlineStyle: "solid",
        outlineWidth: "2px",
        outlineColor:
          colorScheme === "light" ? "rgba(26, 26, 26, 0.6)" : "rgba(255, 255, 255, 0.7)",
      };
      await expect.poll(() => focusAppearance(high)).toMatchObject(visibleFocus);

      await page.keyboard.press("ArrowRight");
      await expect.poll(() => focusAppearance(low)).toMatchObject(visibleFocus);
      expect(await focusAppearance(high)).toMatchObject({
        focused: false,
        checked: false,
        outlineStyle: "none",
      });

      await page.keyboard.press("ArrowLeft");
      await expect.poll(() => focusAppearance(high)).toMatchObject(visibleFocus);
      expect(await focusAppearance(low)).toMatchObject({
        focused: false,
        checked: false,
        outlineStyle: "none",
      });

      await page.keyboard.press("Tab");
      await expect
        .poll(() => focusAppearance(high))
        .toMatchObject({
          focused: false,
          checked: true,
          outlineStyle: "none",
        });
    } finally {
      await page.close();
    }
  }, 30_000);
});
