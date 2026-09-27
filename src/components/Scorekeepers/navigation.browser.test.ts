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

async function openMenuLink(page: Page, name: string) {
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("link", { name, exact: true }).click();
}

describe("scorekeeper navigation", () => {
  it("opens a neutral root and switches scorekeepers through branded choices", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(appUrl);
      await expect
        .poll(() => page.getByRole("img", { name: "Scorekeeper", exact: true }).count())
        .toBe(1);
      expect(await page.locator(".card-background").count()).toBe(0);
      expect(await page.title()).toBe("Scorekeeper");
      expect(await page.getByRole("link", { name: "Create Game", exact: true }).count()).toBe(1);
      expect(await page.getByRole("link", { name: /Phases|Settings|Games/ }).count()).toBe(0);
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      expect(
        await page.getByRole("link", { name: "Players", exact: true }).getAttribute("href"),
      ).toBe("/phase-10-scoreboard/#/players");
      expect(
        await page.getByRole("link", { name: "Games", exact: true }).getAttribute("href"),
      ).toBe("/phase-10-scoreboard/#/games");
      expect(await page.getByRole("link", { name: /Phases|Settings/ }).count()).toBe(0);
      await page.getByRole("link", { name: "Scorekeepers", exact: true }).click();
      const choices = page.getByRole("navigation", { name: "Scorekeepers" });
      const generic = choices.getByRole("link", { name: "Scorekeeper", exact: true });
      const phase = choices.getByRole("link", { name: "Phase Compan10n", exact: true });
      await phase.waitFor();
      expect(await choices.getByRole("link").count()).toBe(2);
      const genericBox = await generic.boundingBox();
      const phaseBox = await phase.boundingBox();
      if (!genericBox || !phaseBox) throw new Error("Missing scorekeeper choices");
      expect(phaseBox.y).toBeGreaterThan(genericBox.y + genericBox.height);
      await phase.focus();
      await page.keyboard.press("Enter");
      await page.getByRole("link", { name: "Create Game", exact: true }).waitFor();
      expect(page.url()).toBe(`${appUrl}#/phaseCompan10n`);
      expect(await page.title()).toBe("Phaze Compan10n");
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      for (const [label, path] of [
        ["Games", "games"],
        ["Players", "players"],
        ["Phases", "phases"],
        ["Settings", "settings"],
      ]) {
        expect(
          await page.getByRole("link", { name: label, exact: true }).getAttribute("href"),
        ).toBe(`/phase-10-scoreboard/#/phaseCompan10n/${path}`);
      }
      await page.getByRole("link", { name: "Scorekeepers", exact: true }).click();
      await generic.click();
      await page.getByRole("img", { name: "Scorekeeper", exact: true }).waitFor();
      expect(page.url()).toBe(`${appUrl}#/`);
    } finally {
      await page.close();
    }
  }, 60_000);

  it("opens and reloads every moved Phase page inside the deployment base", async () => {
    const page = await browser.newPage();
    try {
      for (const route of [
        "",
        "/create",
        "/games",
        "/players",
        "/phases",
        "/settings",
        "/phasescard",
      ]) {
        await page.goto(`${appUrl}#/phaseCompan10n${route}`);
        await expect.poll(() => page.locator(".card-background").count()).toBe(1);
        await page.reload();
        await expect.poll(() => page.locator(".card-background").count()).toBe(1);
        const home = page.getByRole("link", {
          name: route === "/create" ? "Cancel" : "Go home",
          exact: true,
        });
        if (route) {
          expect(await home.getAttribute("href")).toBe("/phase-10-scoreboard/#/phaseCompan10n");
          await home.click();
        }
        await page.getByRole("link", { name: "Create Game", exact: true }).waitFor();
        expect(page.url()).toBe(`${appUrl}#/phaseCompan10n`);
      }
      await page.getByRole("link", { name: "Create Game", exact: true }).click();
      await page.getByRole("button", { name: "Start", exact: true }).waitFor();
      expect(await page.getByRole("button", { name: /Tips|Info/i }).count()).toBe(0);
      expect(await page.getByRole("button", { name: "Start", exact: true }).isDisabled()).toBe(
        true,
      );
    } finally {
      await page.close();
    }
  }, 60_000);

  it("shares Player edits and favorites between shells and starts only nested Phase Games", async () => {
    const page = await browser.newPage();
    try {
      await page.goto(`${appUrl}#/players`);
      for (const name of ["Maya", "Rowan"]) {
        await page.getByRole("button", { name: "Create new player" }).click();
        const dialog = page.getByRole("dialog", { name: "Create player", exact: true });
        await dialog.getByRole("textbox", { name: "Name", exact: true }).fill(name);
        await dialog.getByRole("radio", { name: "Select color Jam", exact: true }).check();
        await dialog.getByRole("switch", { name: "Favorite", exact: true }).click();
        await dialog.getByRole("button", { name: "Save", exact: true }).click();
        await dialog.waitFor({ state: "hidden" });
      }
      expect(await page.locator(".card-background").count()).toBe(0);
      await page.getByRole("link", { name: "Go home", exact: true }).click();
      expect(page.url()).toBe(`${appUrl}#/`);
      await openMenuLink(page, "Scorekeepers");
      await page.getByRole("link", { name: "Phase Compan10n", exact: true }).click();
      await openMenuLink(page, "Players");
      await page.getByRole("button", { name: "Remove Maya from favorites", exact: true }).waitFor();
      expect(await page.locator(".card-background").count()).toBe(1);
      await page.getByRole("button", { name: "Maya", exact: true }).click();
      const editor = page.getByRole("dialog", { name: "Edit player", exact: true });
      expect(
        await editor.getByRole("radio", { name: "Select color Jam", exact: true }).isChecked(),
      ).toBe(true);
      await editor.getByRole("textbox", { name: "Name", exact: true }).fill("Maya Updated");
      await editor.getByRole("radio", { name: "Select color Rose", exact: true }).check();
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await editor.waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Remove Maya Updated from favorites", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Add Maya Updated to favorites", exact: true })
        .waitFor();
      await page.getByRole("link", { name: "Go home", exact: true }).click();
      expect(page.url()).toBe(`${appUrl}#/phaseCompan10n`);
      await openMenuLink(page, "Scorekeepers");
      await page.getByRole("link", { name: "Scorekeeper", exact: true }).click();
      await openMenuLink(page, "Players");
      await page
        .getByRole("button", { name: "Add Maya Updated to favorites", exact: true })
        .waitFor();
      await page.getByRole("button", { name: "Maya Updated", exact: true }).click();
      expect(await editor.getByRole("textbox", { name: "Name", exact: true }).inputValue()).toBe(
        "Maya Updated",
      );
      expect(
        await editor.getByRole("radio", { name: "Select color Rose", exact: true }).isChecked(),
      ).toBe(true);
      expect(
        await editor
          .getByRole("switch", { name: "Favorite", exact: true })
          .getAttribute("aria-checked"),
      ).toBe("false");
      await editor.getByRole("button", { name: "Back to search", exact: true }).click();
      await editor.waitFor({ state: "hidden" });
      await page
        .getByRole("button", { name: "Add Maya Updated to favorites", exact: true })
        .click();
      await page.reload();
      await page
        .getByRole("button", { name: "Remove Maya Updated from favorites", exact: true })
        .waitFor();
      expect(await page.getByRole("button", { name: "Maya", exact: true }).count()).toBe(0);
      expect(await page.getByRole("button", { name: "Maya Updated", exact: true }).count()).toBe(1);

      await page.goto(`${appUrl}#/phaseCompan10n/create`);
      await page.getByRole("button", { name: "Maya Updated", exact: true }).click();
      expect(await page.getByRole("button", { name: "Start", exact: true }).isDisabled()).toBe(
        true,
      );
      await page.getByRole("button", { name: "Rowan", exact: true }).click();
      await page.getByRole("button", { name: "Start", exact: true }).click();
      await page.getByRole("button", { name: "Open Standings", exact: true }).waitFor();
      const gameUrl = page.url();
      expect(gameUrl).toMatch(/#\/phaseCompan10n\/game\/[^/]+$/);
      await page.reload();
      await page.getByRole("button", { name: "Open Standings", exact: true }).waitFor();
      await page.getByRole("link", { name: "Go home", exact: true }).click();
      const gameLink = page.locator('a[href*="/phaseCompan10n/game/"]');
      await gameLink.waitFor();
      await gameLink.click();
      expect(page.url()).toBe(gameUrl);
      await page.goto(gameUrl.replace("/phaseCompan10n/game/", "/game/"));
      await page.getByText("Game not found in Scorekeeper.", { exact: true }).waitFor();
      expect(await page.getByRole("button", { name: "Open Standings", exact: true }).count()).toBe(
        0,
      );
      await page.goto(`${appUrl}#/phaseCompan10n/game/missing-game`);
      await page.getByText("This Game is no longer available.", { exact: true }).waitFor();
      await page.getByRole("link", { name: "Go home", exact: true }).click();
      await page.getByRole("link", { name: "Create Game", exact: true }).waitFor();
      expect(page.url()).toBe(`${appUrl}#/phaseCompan10n`);
    } finally {
      await page.close();
    }
  }, 60_000);

  it("copies nested built-in and self-contained custom Phases Cards that reload in a fresh browser", async () => {
    const page = await browser.newPage();
    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          value: {
            writeText: (text: string) => {
              document.documentElement.dataset.copiedUrl = text;
              return Promise.resolve();
            },
          },
        });
      });
      await page.goto(`${appUrl}#/phaseCompan10n`);
      await page.getByRole("link", { name: "Open Phases Card", exact: true }).click();
      await page.getByRole("button", { name: "Share Phases Card", exact: true }).click();
      await page.getByRole("button", { name: "Phases Card link copied", exact: true }).waitFor();
      const builtInUrl = await page.locator("html").getAttribute("data-copied-url");
      expect(builtInUrl).toBe(`${appUrl}#/phaseCompan10n/phasescard/original`);
      if (!builtInUrl) throw new Error("Missing built-in share URL");
      await page.goto(builtInUrl);
      await page.reload();
      await page.getByText("Original", { exact: true }).waitFor();
      await page.getByText("2 sets of 3", { exact: true }).waitFor();

      const payload = {
        v: 1,
        name: "Travel Set",
        phases: [
          { requirements: [{ type: "set", count: 3, quantity: 2, isSameColor: false }] },
          { requirements: [{ type: "run", count: 7, quantity: 1, isSameColor: false }] },
        ],
      };
      const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
      await page.goto(`${appUrl}#/phaseCompan10n/phasescard/custom?data=${data}`);
      await page.getByText("Travel Set", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Share Phases Card", exact: true }).click();
      await page.getByRole("button", { name: "Phases Card link copied", exact: true }).waitFor();
      const customUrl = await page.locator("html").getAttribute("data-copied-url");
      expect(customUrl).toBe(`${appUrl}#/phaseCompan10n/phasescard/custom?data=${data}`);
      if (!customUrl) throw new Error("Missing custom share URL");
      const recipient = await browser.newPage();
      try {
        await recipient.goto(customUrl);
        await recipient.reload();
        await recipient.getByText("Travel Set", { exact: true }).waitFor();
        expect(
          await recipient
            .getByRole("region", { name: "Phases Card phase list" })
            .locator("[title]")
            .allTextContents(),
        ).toEqual(["2 sets of 3", "1 run of 7"]);
        expect(
          await recipient.getByRole("link", { name: "Go home", exact: true }).getAttribute("href"),
        ).toBe("/phase-10-scoreboard/#/phaseCompan10n");
        await recipient.goto(`${appUrl}#/phaseCompan10n/phasescard/custom?data=invalid`);
        await recipient.getByText("This Phases Card link is invalid.", { exact: true }).waitFor();
        await recipient.goto(`${appUrl}#/phaseCompan10n/phasescard/missing-set`);
        await recipient.getByText("Phase Set not found.", { exact: true }).waitFor();
      } finally {
        await recipient.close();
      }
    } finally {
      await page.close();
    }
  }, 60_000);
});

describe.each(["light", "dark"] as const)("Scorekeeper presentation in %s mode", (colorScheme) => {
  it("fits one-line logos and flat shells while preserving Safe Areas and Visual Bleed", async () => {
    for (const [width, height] of [
      [320, 568],
      [844, 390],
      [1280, 900],
    ]) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme });
      try {
        for (const route of ["/", "/players", "/scorekeepers"]) {
          await page.goto(`${appUrl}#${route}`);
          const logo = page.getByRole("img", { name: "Scorekeeper", exact: true });
          await logo.waitFor();
          await page.evaluate(() => document.fonts.ready);
          await page.addStyleTag({
            content:
              ":root { --safe-area-inset-top: 47px; --safe-area-inset-bottom: 34px; --safe-area-inset-left: 44px; --safe-area-inset-right: 44px; }",
          });
          expect(await page.locator(".card-background, .card-panel-disclaimer").count()).toBe(0);
          expect(await page.getByText(/Mattel/).count()).toBe(0);
          const lettering = await logo.locator("text").evaluateAll((elements) =>
            elements.map((element) => {
              const box = element.getBoundingClientRect();
              const style = getComputedStyle(element);
              return {
                text: element.textContent,
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
                font: style.fontFamily,
                fill: style.fill,
                stroke: style.stroke,
              };
            }),
          );
          expect(lettering).toHaveLength(1);
          expect(lettering[0].text).toBe("Scorekeeper");
          expect(lettering[0].font).toContain("Quicksand");
          expect(lettering[0].fill).not.toBe(lettering[0].stroke);
          expect(lettering[0].left).toBeGreaterThanOrEqual(44);
          expect(lettering[0].right).toBeLessThanOrEqual(width - 44);
          expect(lettering[0].top).toBeGreaterThanOrEqual(47);
          expect(lettering[0].bottom).toBeLessThanOrEqual(height - 34);
          const stripes = await logo.locator("rect").evaluateAll((elements) =>
            elements.map((element) => {
              const box = element.getBoundingClientRect();
              return {
                left: box.left,
                width: box.width,
                top: box.top,
                height: box.height,
                fill: getComputedStyle(element).fill,
              };
            }),
          );
          expect(stripes).toHaveLength(3);
          expect(new Set(stripes.map((stripe) => stripe.fill)).size).toBe(3);
          expect(stripes[0].left).toBeCloseTo(stripes[2].left);
          expect(stripes[0].width).toBeCloseTo(stripes[2].width);
          expect(stripes[1].top).toBeGreaterThan(stripes[0].top + stripes[0].height);
          expect(stripes[2].top).toBeGreaterThan(stripes[1].top + stripes[1].height);
          expect(
            await page.locator(".page-shell-main").evaluate((element) => {
              const style = getComputedStyle(element);
              return [style.marginTop, style.marginBottom, style.paddingTop, style.clipPath];
            }),
          ).toEqual(["0px", "0px", "0px", "none"]);
          expect(
            await page.locator(".page-shell-bottom-bleed").evaluate((element) => {
              const box = element.getBoundingClientRect();
              return {
                top: box.top,
                height: box.height,
                pointerEvents: getComputedStyle(element).pointerEvents,
              };
            }),
          ).toEqual({ top: height, height, pointerEvents: "none" });
          if (route === "/players") {
            expect(
              await page
                .locator(".page-shell-main .dialog-scroll")
                .evaluate((element) => getComputedStyle(element).paddingBottom),
            ).toBe("8px");
            const home = page.getByRole("link", { name: "Go home", exact: true });
            await home.hover();
            await page.mouse.down();
            await expect
              .poll(async () => (await home.boundingBox())?.width)
              .toBeCloseTo((height <= 700 ? 44 : 56) * 1.1, 1);
            const pressed = await home.boundingBox();
            if (!pressed) throw new Error("Missing pressed Home control");
            expect(pressed.x).toBeGreaterThanOrEqual(44);
            expect(pressed.y + pressed.height).toBeLessThanOrEqual(height - 34);
            await page.mouse.up();
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        }
      } finally {
        await page.close();
      }
    }
  }, 60_000);
});
