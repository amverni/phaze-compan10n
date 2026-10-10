/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

const surfaces = ["catalog", "add phases"] as const;
type Surface = (typeof surfaces)[number];
const longName = "Fixture Phase Set with a very long name distinguishing the final option";

beforeAll(async () => {
  server = await createServer({ server: { host: "127.0.0.1", port: 0, open: false } });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  appUrl = `http://127.0.0.1:${address.port}/scorekeeper/`;
  browser = await webkit.launch();
}, 60_000);

it.each(
  surfaces,
)("labels Phase Sets clearly and truncates only the selected name on narrow %s screens", async (surface) => {
  const { page } = await openSurface(surface, { width: 320, height: 568 });
  try {
    const trigger = page.getByRole("button", { name: "Phase Set: All", exact: true });
    await trigger.click({ timeout: 5_000 });
    await page.getByRole("option", { name: "All", exact: true }).waitFor();
    const option = page.getByRole("option", { name: longName, exact: true });
    await option.scrollIntoViewIfNeeded();
    await settle(page);
    const optionBounds = await box(option);
    expect(optionBounds.height).toBeGreaterThan(50);
    expect((await option.innerText()).trim()).toBe(longName);
    await option.tap();
    const selected = page.getByRole("button", { name: `Phase Set: ${longName}`, exact: true });
    await selected.waitFor();
    await settle(page);
    const bounds = await box(selected);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    const label = selected.getByText("Phase Set:", { exact: true });
    const value = selected.getByText(longName, { exact: true });
    const arrow = selected.locator("svg");
    const [labelBounds, valueBounds, arrowBounds] = await Promise.all([
      box(label),
      box(value),
      box(arrow),
    ]);
    expect(labelBounds.x).toBeGreaterThan(bounds.x);
    expect(valueBounds.x).toBeGreaterThanOrEqual(labelBounds.x + labelBounds.width + 5);
    expect(arrowBounds.x).toBeGreaterThanOrEqual(valueBounds.x + valueBounds.width + 5);
    expect(arrowBounds.x + arrowBounds.width).toBeLessThan(bounds.x + bounds.width);
    expect(
      await value.evaluate((element) => ({
        truncated: element.scrollWidth > element.clientWidth,
        ellipsis: getComputedStyle(element).textOverflow,
      })),
    ).toEqual({ truncated: true, ellipsis: "ellipsis" });
  } finally {
    await page.close();
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function openSurface(surface: Surface, viewport = { width: 390, height: 600 }) {
  const page = await browser.newPage({ viewport, hasTouch: true });
  await page.goto(appUrl);
  const finalName = await page.evaluate<string>(`(async () => {
    const { phaseSetsApi } = await import("/scorekeeper/src/data/api/phaseSets.ts");
    for (let index = 1; index <= 24; index++) {
      await phaseSetsApi.create({
        type: "saved",
        name: index === 24 ? ${JSON.stringify(longName)} : "Fixture Phase Set " + String(index).padStart(2, "0"),
        phases: ["classic-1", "classic-2"],
      });
    }
    return (await phaseSetsApi.getAll()).at(-1).name;
  })()`);
  await page.goto(`${appUrl}#/phaseCompan10n/${surface === "catalog" ? "phases" : "create"}`);
  await page.getByRole("tab", { name: "Phases", exact: true }).click();
  if (surface === "add phases") {
    await page.getByRole("button", { name: "Add Phase", exact: true }).click();
  }
  await page.getByRole("button", { name: "Type: All", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
  return { page, finalName };
}

async function settle(page: Page) {
  await page.evaluate(() =>
    Promise.allSettled(document.getAnimations().map((animation) => animation.finished)),
  );
}

async function box(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error("Missing visible control");
  return bounds;
}

it.each(surfaces)("separates the Type label from its arrow on %s", async (surface) => {
  const { page } = await openSurface(surface);
  try {
    const trigger = page.getByRole("button", { name: "Type: All", exact: true });
    const geometry = await trigger.evaluate((element) => {
      const content = element.firstElementChild;
      const arrow = element.querySelector("svg");
      if (!content || !arrow) throw new Error("Missing trigger text or arrow");
      const range = document.createRange();
      range.selectNodeContents(content);
      return {
        gap: arrow.getBoundingClientRect().left - range.getBoundingClientRect().right,
        button: element.getBoundingClientRect().width,
        content: content.getBoundingClientRect().width,
        text: range.getBoundingClientRect().width,
        padding: getComputedStyle(element).padding,
        border: getComputedStyle(element).borderWidth,
      };
    });
    expect(geometry.gap, JSON.stringify(geometry)).toBeGreaterThanOrEqual(5);
  } finally {
    await page.close();
  }
}, 60_000);

function content(page: Page, surface: Surface) {
  return surface === "catalog"
    ? page.getByRole("tabpanel", { name: "Phases", exact: true })
    : page.getByRole("dialog", { name: "Add phases", exact: true });
}

function hitTest(option: Locator) {
  return option.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return element.contains(
      document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
    );
  });
}

async function expectPanelBounds(page: Page, insets = { top: 0, right: 0, bottom: 0, left: 0 }) {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("Missing viewport");
  const bounds = await box(page.getByRole("listbox"));
  expect(bounds.x).toBeGreaterThanOrEqual(insets.left);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width - insets.right);
  expect(bounds.y).toBeGreaterThanOrEqual(insets.top);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height - insets.bottom);
  return bounds;
}

it.each(
  surfaces,
)("keeps overflowing options selectable without scrolling the underlying %s list", async (surface) => {
  for (const viewport of [
    { width: 390, height: 600 },
    { width: 844, height: 390 },
    { width: 320, height: 390 },
    { width: 390, height: 844 },
    { width: 1280, height: 900 },
  ]) {
    const { page, finalName } = await openSurface(surface, viewport);
    try {
      const list = content(page, surface).locator(".dialog-scroll").last();
      await list.evaluate((element) => {
        element.scrollTop = 70;
      });
      const scrollTop = await list.evaluate((element) => element.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
      const trigger = page.getByRole("button", { name: "Phase Set: All", exact: true });
      await trigger.click();
      await settle(page);
      const bounds = await expectPanelBounds(page);
      const triggerBounds = await box(trigger);
      if (viewport.height === 390 && (surface === "catalog" || viewport.width === 320)) {
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(triggerBounds.y);
      }
      const option = page.getByRole("option", { name: finalName, exact: true });
      expect(await hitTest(option)).toBe(false);
      await page.mouse.move(bounds.x + 2, bounds.y + bounds.height / 2);
      await page.mouse.wheel(0, 4000);
      await expect.poll(() => hitTest(option), { timeout: 5_000 }).toBe(true);
      await page.mouse.wheel(0, 4000);
      if (viewport.width === 390 && viewport.height === 600) {
        const optionBounds = await box(option);
        const footer = await box(page.locator(".page-shell-footer"));
        expect(optionBounds.y + optionBounds.height / 2).toBeGreaterThan(footer.y);
      }
      await option.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        for (const [type, dx, dy] of [
          ["touchstart", 0, 0],
          ["touchmove", -150, 60],
          ["touchend", -150, 60],
        ] as const) {
          const touch = {
            identifier: 1,
            target: element,
            clientX: rect.right - 20 + dx,
            clientY: rect.y + 10 + dy,
          };
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperties(event, {
            touches: { value: type === "touchend" ? [] : [touch] },
            changedTouches: { value: [touch] },
          });
          element.dispatchEvent(event);
        }
      });
      expect(await list.evaluate((element) => element.scrollTop)).toBe(scrollTop);
      expect(
        await page
          .getByRole("tab", { name: "Phases", exact: true, includeHidden: true })
          .getAttribute("aria-selected"),
      ).toBe("true");
      await option.tap();
      await page.getByRole("button", { name: `Phase Set: ${finalName}`, exact: true }).waitFor();
      await expect
        .poll(() =>
          content(page, surface).getByRole("button", { name: "2 sets of 3", exact: true }).count(),
        )
        .toBe(1);
      await settle(page);
      expect(
        await content(page, surface)
          .getByRole("button", { name: "1 set of 3 and 1 run of 4", exact: true })
          .count(),
      ).toBe(1);
    } finally {
      await page.close();
    }
  }
}, 120_000);

it.each(
  surfaces,
)("repositions an open %s filter after rotation and respects Safe Areas", async (surface) => {
  const { page } = await openSurface(surface, { width: 390, height: 844 });
  try {
    const insets = { top: 47, right: 44, bottom: 34, left: 44 };
    await page.addStyleTag({
      content:
        ":root { --safe-area-inset-top: 47px; --safe-area-inset-right: 44px; --safe-area-inset-bottom: 34px; --safe-area-inset-left: 44px; }",
    });
    await page.getByRole("button", { name: "Phase Set: All", exact: true }).click();
    await settle(page);
    await expectPanelBounds(page, insets);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(async () => {
        const bounds = await box(page.getByRole("listbox"));
        return bounds.y + bounds.height;
      })
      .toBeLessThanOrEqual(390 - insets.bottom);
    await settle(page);
    await expectPanelBounds(page, insets);
    const option = page.getByRole("option", { name: longName, exact: true });
    await option.scrollIntoViewIfNeeded();
    await expect.poll(() => hitTest(option)).toBe(true);
    await option.tap();
    await page.getByRole("button", { name: `Phase Set: ${longName}`, exact: true }).waitFor();
  } finally {
    await page.close();
  }
}, 60_000);

it.each(
  surfaces,
)("preserves keyboard, dismissal, and combined filtering on %s", async (surface) => {
  const { page } = await openSurface(surface);
  try {
    const all = page.getByRole("button", { name: "Phase Set: All", exact: true });
    await all.focus();
    await page.keyboard.press("ArrowDown");
    await page.getByRole("option", { name: "All", exact: true }).waitFor();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    const original = page.getByRole("button", { name: "Phase Set: Original", exact: true });
    await original.waitFor();
    await expect
      .poll(() => original.evaluate((element) => element === document.activeElement))
      .toBe(true);
    await original.click();
    await page.keyboard.press("Escape");
    await page.getByRole("listbox").waitFor({ state: "detached" });
    expect(await original.evaluate((element) => element === document.activeElement)).toBe(true);
    await original.click();
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await all.waitFor();

    await all.click();
    await page.getByRole("option", { name: "Fixture Phase Set 01", exact: true }).click();
    const named = page.getByRole("button", {
      name: "Phase Set: Fixture Phase Set 01",
      exact: true,
    });
    await named.waitFor();
    await expect
      .poll(() =>
        content(page, surface).getByRole("button", { name: "1 run of 9", exact: true }).count(),
      )
      .toBe(0);
    const type = page.getByRole("button", { name: "Type: All", exact: true });
    await type.click();
    expect(await page.getByRole("listbox").getAttribute("aria-multiselectable")).toBe("true");
    await expectPanelBounds(page);
    await page.getByRole("option", { name: "Run", exact: true }).click();
    await page.getByRole("option", { name: "Color Group", exact: true }).click();
    expect(
      await page.getByRole("option", { name: "Set", exact: true }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      await page.getByRole("option", { name: "Run", exact: true }).getAttribute("aria-selected"),
    ).toBe("false");
    await page.keyboard.press("Escape");
    const setType = page.getByRole("button", { name: "Type: Set", exact: true });
    await setType.waitFor();
    const search = page.getByPlaceholder(/^Search phases/);
    await search.fill("run of 4");
    await expect
      .poll(() =>
        content(page, surface).getByRole("button", { name: "2 sets of 3", exact: true }).count(),
      )
      .toBe(0);
    expect(
      await content(page, surface)
        .getByRole("button", { name: "1 set of 3 and 1 run of 4", exact: true })
        .count(),
    ).toBe(1);

    await named.click();
    await page.getByRole("option", { name: "All", exact: true }).click();
    await all.waitFor();
    expect(await search.inputValue()).toBe("run of 4");
    expect(await setType.count()).toBe(1);
    await expect
      .poll(() =>
        content(page, surface)
          .getByRole("button", { name: "1 set of 4 and 1 run of 4", exact: true })
          .count(),
      )
      .toBe(1);
    await setType.click();
    await page.getByRole("option", { name: "Run", exact: true }).click();
    expect(
      await page.getByRole("option", { name: "Set", exact: true }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      await page.getByRole("option", { name: "Run", exact: true }).getAttribute("aria-selected"),
    ).toBe("true");
    const searchBounds = await box(search);
    await page.mouse.click(
      searchBounds.x + searchBounds.width / 2,
      searchBounds.y + searchBounds.height / 2,
    );
    await page.getByRole("listbox").waitFor({ state: "detached" });
    expect(await page.getByRole("button", { name: "Type: Set, Run", exact: true }).count()).toBe(1);
    expect(await search.isVisible()).toBe(true);
    expect(
      await page
        .getByRole("tab", { name: "Phases", exact: true, includeHidden: true })
        .getAttribute("aria-selected"),
    ).toBe("true");
    if (surface === "add phases") {
      expect(await content(page, surface).count()).toBe(1);
    }
  } finally {
    await page.close();
  }
}, 60_000);
