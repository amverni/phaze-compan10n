/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RandomPhasesButton } from "../Create/Phases/RandomPhasesButton";
import { RoundResultSection } from "../Scoreboard/RoundResultSection";
import { Button } from "./Button/Button";
import { Listbox, ListboxButton } from "./Listbox/Listbox";

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

function surface(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      backdropFilter: style.getPropertyValue("backdrop-filter"),
      opacity: style.opacity,
      color: style.color,
    };
  });
}

async function mountSurfaceExamples(page: Page) {
  const markup = renderToStaticMarkup(
    <>
      <Button className="px-4 py-2">Neutral action</Button>
      <Button className="px-4 py-2" disabled>
        Disabled action
      </Button>
      <Button className="glass-danger px-4 py-2 text-white">Delete action</Button>
      <RandomPhasesButton onRandom={() => {}} />
      <Listbox value="Example" onChange={() => {}}>
        <ListboxButton>Example</ListboxButton>
      </Listbox>
      <RoundResultSection
        value="completed"
        onChange={() => {}}
        expanded
        onToggleExpand={() => {}}
      />
      <div className="glass relative rounded-xl p-4" data-testid="non-button-glass">
        Unchanged panel
      </div>
    </>,
  );
  await page.evaluate((html) => {
    const host = document.createElement("div");
    host.id = "button-surface-examples";
    host.style.cssText =
      "position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:start;gap:16px;padding:24px;background:var(--color-app-background);overflow:auto";
    host.innerHTML = html;
    document.body.appendChild(host);
  }, markup);
}

describe.each(["light", "dark"] as const)("opaque button surfaces in %s mode", (colorScheme) => {
  it("uses solid neutral surfaces for links, nested icons, dropdowns, and compound controls", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme,
      hasTouch: true,
    });
    const background = colorScheme === "light" ? "rgb(255, 255, 255)" : "rgb(38, 38, 38)";
    const color = colorScheme === "light" ? "rgb(26, 26, 26)" : "rgb(255, 255, 255)";
    try {
      await page.goto(`${appUrl}#/phaseCompan10n`);
      const phases = page.getByRole("link", { name: "Open Phases Card" });
      await phases.waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const control of [
        phases,
        page.getByRole("link", { name: "Create Game" }),
        page.getByRole("button", { name: "Menu", exact: true }).locator(":scope > .glass"),
      ]) {
        expect(await surface(control)).toMatchObject({
          background,
          backdropFilter: "none",
          opacity: "1",
          color,
        });
      }
      const phasesBounds = await phases.boundingBox();
      expect(phasesBounds?.height).toBe(56);
      expect(phasesBounds?.width).toBeGreaterThanOrEqual(48);
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page.getByRole("link", { name: "Players", exact: true }).waitFor();
      await page.keyboard.press("Escape");

      await mountSurfaceExamples(page);
      const examples = page.locator("#button-surface-examples");
      for (const control of [
        examples.getByRole("button", { name: "Neutral action", exact: true }),
        examples.getByRole("button", { name: "Example", exact: true }),
        examples.getByRole("group", { name: "Random phase count picker" }),
        examples.getByRole("button", { name: "Failed", exact: true }),
      ]) {
        expect(await surface(control)).toMatchObject({
          background,
          backdropFilter: "none",
          opacity: "1",
          color,
        });
      }
      const disabled = examples.getByRole("button", { name: "Disabled action" });
      expect(await disabled.isDisabled()).toBe(true);
      expect(await surface(disabled)).toMatchObject({ background, opacity: "0.4" });
      const failed = examples.getByRole("button", { name: "Failed", exact: true });
      await failed.evaluate((element) => element.setAttribute("disabled", ""));
      await expect.poll(() => surface(failed)).toMatchObject({ background, opacity: "0.5" });
      await expect.poll(async () => (await surface(failed.locator("span"))).opacity).toBe("1");
      expect(
        await examples.getByTestId("non-button-glass").evaluate((element) => {
          const style = getComputedStyle(element);
          return style.getPropertyValue("backdrop-filter");
        }),
      ).not.toBe("none");
    } finally {
      await page.close();
    }
  }, 30_000);

  it("retains opaque destructive and selected-result colors without recoloring panels", async () => {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      colorScheme,
    });
    try {
      await page.goto(`${appUrl}#/phaseCompan10n`);
      await page.getByRole("link", { name: "Open Phases Card" }).waitFor();
      await mountSurfaceExamples(page);
      const examples = page.locator("#button-surface-examples");
      expect(await surface(examples.getByRole("button", { name: "Delete action" }))).toMatchObject({
        background: "rgb(230, 10, 10)",
        backdropFilter: "none",
        color: "rgb(255, 255, 255)",
      });
      const passed = examples.getByRole("button", { name: "Passed", exact: true });
      expect(await passed.getAttribute("aria-pressed")).toBe("true");
      expect(
        await passed.evaluate((element) => {
          const style = getComputedStyle(element);
          const reference = document.createElement("span");
          reference.style.backgroundColor = "var(--color-pt-green-500)";
          element.appendChild(reference);
          const matches = style.backgroundColor === getComputedStyle(reference).backgroundColor;
          reference.remove();
          return matches;
        }),
      ).toBe(true);
      const panel = await surface(examples.getByTestId("non-button-glass"));
      expect(panel.background).toBe(
        colorScheme === "light" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.03)",
      );
    } finally {
      await page.close();
    }
  }, 30_000);
});
