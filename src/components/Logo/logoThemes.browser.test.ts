/// <reference types="node" />

import type { Browser, Locator, Page } from "playwright";
import { webkit } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { afterAll, beforeAll, expect, it } from "vitest";

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

const ARCADE = ["#2563EB", "#06B6D4", "#8B5CF6", "#EC4899"];
const PHASE = [
  "var(--color-pt-red-500)",
  "var(--color-pt-blue-500)",
  "var(--color-pt-green-500)",
  "var(--color-pt-yellow-500)",
];
const HALLOWEEN = ["#080808", "#F97316", "#080808", "#F97316"];
const LIONS = ["#B0B7BC", "#0076B6", "#0076B6", "#B0B7BC"];

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

function scorekeeperStripes(page: Page) {
  return page.getByRole("img", { name: "Scorekeeper", exact: true }).locator("rect");
}

function phaseStripes(page: Page) {
  return page.locator('svg[aria-hidden="true"] polygon');
}

async function expectColors(stripes: Locator, colors: readonly string[]) {
  await expect
    .poll(() => stripes.evaluateAll((elements) => elements.map((el) => el.getAttribute("fill"))))
    .toEqual(colors);
}

async function lettering(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.locator('svg[role="img"] text').evaluateAll((elements) =>
    elements.map((element) => ({
      content: element.textContent,
      attributes: [...element.attributes].map((attribute) => [attribute.name, attribute.value]),
      bounds: element.getBoundingClientRect().toJSON(),
    })),
  );
}

async function trackRefreshTimeouts(page: Page) {
  await page.addInitScript(() => {
    const active = new Map<number, { delay: number; due: number }>();
    const browserWindow: Window = window;
    const setTimeout = browserWindow.setTimeout.bind(browserWindow);
    const clearTimeout = browserWindow.clearTimeout.bind(browserWindow);
    Object.defineProperty(window, "logoThemeTimeouts", { value: active });
    browserWindow.setTimeout = (handler, delay, ...args) => {
      if (typeof handler !== "function" || handler.name !== "refresh") {
        return setTimeout(handler, delay, ...args);
      }
      const id = setTimeout(() => {
        active.delete(id);
        handler(...args);
      }, delay);
      active.set(id, { delay: delay ?? 0, due: Date.now() + (delay ?? 0) });
      return id;
    };
    browserWindow.clearTimeout = (id) => {
      if (id !== undefined) active.delete(id);
      clearTimeout(id);
    };
  });
}

function refreshTimeouts(page: Page) {
  return page.evaluate<{ delay: number; due: number }[]>(
    "Array.from(window.logoThemeTimeouts.values())",
  );
}

async function expectOneTimeout(page: Page, due?: string) {
  await expect.poll(async () => (await refreshTimeouts(page)).length).toBe(1);
  if (due) expect((await refreshTimeouts(page))[0].due).toBe(new Date(due).getTime());
}

async function expectGeometry(page: Page, count: 3 | 4) {
  for (const logo of await page.getByRole("img", { name: "Scorekeeper", exact: true }).all()) {
    const geometry = await logo.evaluate((element) => {
      const stripes = [...element.querySelectorAll("rect")];
      const top = stripes[0].y.baseVal.value;
      const last = stripes[stripes.length - 1];
      const bottom = last.y.baseVal.value + last.height.baseVal.value;
      return {
        center: (top + bottom) / 2,
        band: bottom - top,
        stripes: stripes.map((stripe) => ({
          height: stripe.height.baseVal.value,
          top: stripe.y.baseVal.value,
          pointerEvents: getComputedStyle(stripe).pointerEvents,
        })),
      };
    });
    expect(geometry.center).toBe(59.5625);
    expect(geometry.band).toBe(66);
    expect(geometry.stripes).toHaveLength(count);
    for (const [index, stripe] of geometry.stripes.entries()) {
      expect(stripe.height).toBe(count === 3 ? 18 : 12);
      expect(stripe.pointerEvents).toBe("none");
      if (index > 0) {
        const previous = geometry.stripes[index - 1];
        expect(stripe.top - previous.top - previous.height).toBeCloseTo(6, 4);
      }
    }
  }
  const geometry = await phaseStripes(page).evaluateAll((elements) =>
    elements.map((element) => {
      if (!(element instanceof SVGPolygonElement)) throw new Error("Missing Phase stripe");
      const svg = element.ownerSVGElement;
      if (!svg) throw new Error("Missing Phase stripe SVG");
      const points = [...element.points];
      const width = svg.getBoundingClientRect().width;
      const visible = Math.min(width, svg.parentElement?.getBoundingClientRect().width ?? width);
      return {
        top: (points[0].y + points[1].y) / 2,
        bottom: (points[2].y + points[3].y) / 2,
        slope: ((points[1].y - points[0].y) / (points[1].x - points[0].x)) * visible,
        pointerEvents: getComputedStyle(element).pointerEvents,
      };
    }),
  );
  expect(geometry).toHaveLength(count);
  expect((geometry[0].top + geometry[count - 1].bottom) / 2).toBeCloseTo(78.6, 4);
  expect(geometry[count - 1].bottom - geometry[0].top).toBeCloseTo(63, 4);
  for (const [index, stripe] of geometry.entries()) {
    expect(stripe.bottom - stripe.top).toBeCloseTo(count === 3 ? 53 / 3 : 12, 4);
    expect(stripe.slope).toBeCloseTo(-50, 3);
    expect(stripe.pointerEvents).toBe("none");
    if (index > 0) expect(stripe.top - geometry[index - 1].bottom).toBeCloseTo(5, 4);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
}

it("initially shows Halloween in both chooser logos and changes appearance without navigation", async () => {
  const page = await browser.newPage({
    timezoneId: "America/New_York",
    colorScheme: "light",
    viewport: { width: 390, height: 844 },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const scorekeeper = [...document.querySelectorAll('svg[role="img"] rect')];
        const phase = [...document.querySelectorAll('svg[aria-hidden="true"] polygon')];
        if (scorekeeper.length && phase.length) {
          Object.defineProperty(window, "firstLogoColors", {
            value: [scorekeeper, phase].map((stripes) =>
              stripes.map((stripe) => stripe.getAttribute("fill")),
            ),
          });
          observer.disconnect();
        }
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.clock.setFixedTime(new Date("2026-10-31T16:00:00Z"));
    await page.goto(`${appUrl}#/scorekeepers`);
    await expectColors(scorekeeperStripes(page), HALLOWEEN);
    await expectColors(phaseStripes(page), HALLOWEEN);
    expect(await page.evaluate("window.firstLogoColors")).toEqual([HALLOWEEN, HALLOWEEN]);
    const before = await lettering(page);
    await expectGeometry(page, 4);
    await page.emulateMedia({ colorScheme: "dark" });
    const dark = ["#6D28D9", "#F97316", "#6D28D9", "#F97316"];
    await expectColors(scorekeeperStripes(page), dark);
    await expectColors(phaseStripes(page), dark);
    await expectGeometry(page, 4);
    expect(await lettering(page)).toEqual(before);
    expect(page.url()).toBe(`${appUrl}#/scorekeepers`);
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
}, 30_000);

it("changes both logos at device-local midnight without navigating or moving lettering", async () => {
  const page = await browser.newPage({
    timezoneId: "America/New_York",
    colorScheme: "light",
    viewport: { width: 390, height: 844 },
  });
  try {
    const beforeMidnight = new Date("2026-10-31T03:59:59Z");
    await page.clock.install({ time: beforeMidnight });
    await page.clock.pauseAt(beforeMidnight);
    await trackRefreshTimeouts(page);
    await page.goto(`${appUrl}#/scorekeepers`);
    await expectColors(scorekeeperStripes(page), ARCADE);
    await expectOneTimeout(page, "2026-10-31T04:00:00Z");
    const before = await lettering(page);
    await page.clock.runFor(1001);
    await expectColors(scorekeeperStripes(page), HALLOWEEN);
    await expectColors(phaseStripes(page), HALLOWEEN);
    await expectOneTimeout(page, "2026-11-01T04:00:00Z");
    expect(await lettering(page)).toEqual(before);
    expect(page.url()).toBe(`${appUrl}#/scorekeepers`);
  } finally {
    await page.close();
  }
}, 30_000);

async function seedGames(page: Page) {
  await page.goto(`${appUrl}#/players`);
  await page.getByText("No players yet", { exact: true }).waitFor();
  return page.evaluate<{ generic: string; phase: string }>(`(async () => {
    const { playersApi } = await import("/scorekeeper/src/data/api/players.ts");
    const { genericGamesApi } = await import("/scorekeeper/src/data/api/genericGames.ts");
    const { genericRoundsApi } = await import("/scorekeeper/src/data/api/genericRounds.ts");
    const { gamesApi } = await import("/scorekeeper/src/data/api/games.ts");
    const { roundsApi } = await import("/scorekeeper/src/data/api/rounds.ts");
    const maya = await playersApi.create({ name: "Maya", color: "Ocean", isFavorite: 0 });
    const rowan = await playersApi.create({ name: "Rowan", color: "Rose", isFavorite: 0 });
    const generic = await genericGamesApi.create({
      name: "Evening scores",
      players: [maya.id, rowan.id],
      settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
    });
    await genericRoundsApi.add({
      gameId: generic.id, mode: "points",
      scores: [{ playerId: maya.id, points: "5" }, { playerId: rowan.id, points: "9" }],
    });
    const phase = await gamesApi.create({
      players: [maya.id, rowan.id],
      phaseSet: { id: "theme-fixture", type: "temporary", name: "Two Phases", phases: ["classic-1", "classic-2"] },
      settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 0 },
    });
    await roundsApi.add({
      gameId: phase.id, roundWinnerId: maya.id,
      scores: [
        { playerId: maya.id, score: 0, phaseStatus: "completed" },
        { playerId: rowan.id, score: 0, phaseStatus: "failed" },
      ],
    });
    return { generic: generic.id, phase: phase.id };
  })()`);
}

it.each([
  {
    day: "ordinary football Saturday",
    date: "2026-10-10T16:00:00Z",
    scorekeeper: ["#00274C", "#FFCB05", "#00274C", "#FFCB05"],
    phase: PHASE,
  },
  {
    day: "Halloween Saturday",
    date: "2026-10-31T16:00:00Z",
    scorekeeper: HALLOWEEN,
    phase: HALLOWEEN,
  },
])("inherits the correct scope throughout real Home, shell, chooser, Game and Phases Card routes on $day", async ({
  date,
  scorekeeper,
  phase,
}) => {
  const page = await browser.newPage({
    timezoneId: "America/New_York",
    colorScheme: "light",
    viewport: { width: 390, height: 844 },
  });
  try {
    await page.clock.setFixedTime(new Date(date));
    const games = await seedGames(page);
    for (const route of ["/", "/players", `/game/${games.generic}`]) {
      await page.goto(`${appUrl}#${route}`);
      await expectColors(scorekeeperStripes(page), scorekeeper);
      expect(await page.getByRole("img", { name: "Scorekeeper", exact: true }).count()).toBe(1);
      expect(await page.locator(".card-background").count()).toBe(0);
      expect(await page.title()).toBe("Scorekeeper");
      if (route.includes("/game/")) {
        await page.getByRole("button", { name: "Open Standings", exact: true }).waitFor();
      }
    }
    for (const route of [
      "/phaseCompan10n",
      "/phaseCompan10n/players",
      `/phaseCompan10n/game/${games.phase}`,
      "/phaseCompan10n/phasescard/original",
    ]) {
      await page.goto(`${appUrl}#${route}`);
      await expectColors(phaseStripes(page), phase);
      expect(await page.getByRole("img", { name: "Phaze Compan10n", exact: true }).count()).toBe(1);
      expect(await page.locator(".card-background").count()).toBe(1);
      if (route.includes("/game/")) {
        await page.getByRole("button", { name: "Open Standings", exact: true }).waitFor();
      }
      if (route.endsWith("/original"))
        await page.getByText("2 sets of 3", { exact: true }).waitFor();
    }
    await page.goto(`${appUrl}#/scorekeepers`);
    await expectColors(scorekeeperStripes(page), scorekeeper);
    await expectColors(phaseStripes(page), phase);
    expect(await page.getByRole("link", { name: "Scorekeeper", exact: true }).count()).toBe(1);
    expect(await page.getByRole("link", { name: "Phase Compan10n", exact: true }).count()).toBe(1);
    await expectGeometry(page, 4);
  } finally {
    await page.close();
  }
}, 60_000);

function savedGames(page: Page, games: { generic: string; phase: string }) {
  return page.evaluate(`(async () => {
    const { genericGamesApi } = await import("/scorekeeper/src/data/api/genericGames.ts");
    const { genericRoundsApi } = await import("/scorekeeper/src/data/api/genericRounds.ts");
    const { gamesApi } = await import("/scorekeeper/src/data/api/games.ts");
    const { roundsApi } = await import("/scorekeeper/src/data/api/rounds.ts");
    return Promise.all([
      genericGamesApi.getById(${JSON.stringify(games.generic)}),
      genericRoundsApi.getByGameId(${JSON.stringify(games.generic)}),
      gamesApi.getById(${JSON.stringify(games.phase)}),
      roundsApi.getByGameId(${JSON.stringify(games.phase)}),
    ]);
  })()`);
}

function surfaceStyles(page: Page) {
  return page
    .locator(
      ".page-shell-header, .page-shell-main, .page-shell-footer, [role=dialog], [role=tab], svg[role=img] text",
    )
    .evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return {
          tag: element.tagName,
          className: element.getAttribute("class"),
          label: element.getAttribute("aria-label"),
          background: style.backgroundColor,
          color: style.color,
          fill: style.fill,
          stroke: style.stroke,
          border: style.borderColor,
          shadow: style.boxShadow,
          clip: style.clipPath,
        };
      }),
    );
}

it("refreshes behind a live unsaved score entry without changing saved Games, controls or broader styling", async () => {
  const page = await browser.newPage({
    timezoneId: "America/New_York",
    colorScheme: "light",
    viewport: { width: 390, height: 844 },
  });
  try {
    await page.clock.setFixedTime(new Date("2026-10-30T16:00:00Z"));
    const games = await seedGames(page);
    await page.goto(`${appUrl}#/game/${games.generic}`);
    await page.getByRole("cell", { name: "Maya, Round 1: 5 Points", exact: true }).waitFor();
    await page.getByRole("cell", { name: "Rowan, Round 1: 9 Points", exact: true }).waitFor();
    await page.getByRole("button", { name: "Add Round", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add Round", exact: true });
    await dialog.getByRole("button", { name: "4", exact: true }).click();
    await dialog.getByRole("button", { name: "2", exact: true }).click();
    const entry = dialog.getByRole("status", { name: "Maya Points", exact: true });
    expect(await entry.innerText()).toBe("42");
    const before = await savedGames(page, games);
    const styles = await surfaceStyles(page);
    const word = await lettering(page);
    const buttons = await dialog.getByRole("button").allTextContents();
    await page.clock.setFixedTime(new Date("2026-10-31T16:00:00Z"));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expectColors(page.locator(".page-shell-header svg rect"), HALLOWEEN);
    expect(await entry.innerText()).toBe("42");
    expect(
      await dialog.getByRole("tab", { name: "Maya", exact: true }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(await dialog.getByRole("button", { name: "Save", exact: true }).isEnabled()).toBe(true);
    expect(await dialog.getByRole("button").allTextContents()).toEqual(buttons);
    expect(await lettering(page)).toEqual(word);
    expect(await surfaceStyles(page)).toEqual(styles);
    expect(await savedGames(page, games)).toEqual(before);
    expect(page.url()).toBe(`${appUrl}#/game/${games.generic}`);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    expect(
      await page.getByRole("button", { name: "Open Standings", exact: true }).isEnabled(),
    ).toBe(true);
    await page.getByRole("button", { name: "Add Round", exact: true }).click();
    expect(await entry.innerText()).toBe("42");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.reload();
    await page.getByRole("cell", { name: "Maya, Round 1: 5 Points", exact: true }).waitFor();
    await page.getByRole("cell", { name: "Maya, Round 2: 42 Points", exact: true }).waitFor();
    await page.getByRole("heading", { name: "Evening scores", exact: true }).waitFor();
    await expectColors(scorekeeperStripes(page), HALLOWEEN);
  } finally {
    await page.close();
  }
}, 60_000);

it.each([
  { date: "2026-02-14T17:00:00Z", colors: ["#F9A8D4", "#DC2626", "#F9A8D4", "#DC2626"], count: 4 },
  { date: "2026-07-04T16:00:00Z", colors: ["#B31942", "#FFFFFF", "#0A3161"], count: 3 },
] as const)("shares the exact scheduled palette and fixed geometry on $date", async ({
  date,
  colors,
  count,
}) => {
  const page = await browser.newPage({
    timezoneId: "America/New_York",
    colorScheme: "light",
    viewport: { width: 390, height: 844 },
  });
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    await page.clock.setFixedTime(new Date(date));
    await page.goto(`${appUrl}#/scorekeepers`);
    await expectColors(scorekeeperStripes(page), colors);
    await expectColors(phaseStripes(page), colors);
    const before = await lettering(page);
    await expectGeometry(page, count);
    for (const colorScheme of ["dark", "light"] as const) {
      await page.emulateMedia({ colorScheme });
      await expectColors(scorekeeperStripes(page), colors);
      await expectColors(phaseStripes(page), colors);
      await expectGeometry(page, count);
      expect(await lettering(page)).toEqual(before);
      if (count === 3) {
        for (const stripes of [scorekeeperStripes(page), phaseStripes(page)]) {
          expect(await stripes.nth(1).evaluate((element) => getComputedStyle(element).fill)).toBe(
            "rgb(255, 255, 255)",
          );
        }
      }
    }
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
}, 30_000);

it.each([
  "focus",
  "visibility",
] as const)("catches up after suspension on %s and re-arms the next local midnight", async (event) => {
  const page = await browser.newPage({ timezoneId: "America/New_York", colorScheme: "light" });
  try {
    const start = new Date("2026-10-30T16:00:00Z");
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);
    await trackRefreshTimeouts(page);
    await page.goto(`${appUrl}#/scorekeepers`);
    await expectColors(scorekeeperStripes(page), ARCADE);
    await expectOneTimeout(page, "2026-10-31T04:00:00Z");
    const before = await lettering(page);
    await page.clock.setSystemTime(new Date("2026-11-01T03:59:59Z"));
    await expectColors(scorekeeperStripes(page), ARCADE);
    if (event === "visibility") {
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await expectColors(scorekeeperStripes(page), ARCADE);
      await expectOneTimeout(page, "2026-10-31T04:00:00Z");
      await page.evaluate(() => {
        Object.defineProperty(document, "visibilityState", {
          configurable: true,
          value: "visible",
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
    } else {
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    }
    await expectColors(scorekeeperStripes(page), HALLOWEEN);
    await expectColors(phaseStripes(page), HALLOWEEN);
    await expectOneTimeout(page, "2026-11-01T04:00:00Z");
    await page.clock.runFor(1001);
    await expectColors(scorekeeperStripes(page), LIONS);
    await expectColors(phaseStripes(page), PHASE);
    await expectOneTimeout(page, "2026-11-02T05:00:00Z");
    expect(await lettering(page)).toEqual(before);
    expect(page.url()).toBe(`${appUrl}#/scorekeepers`);
  } finally {
    await page.close();
  }
}, 30_000);

it.each([
  {
    name: "spring",
    start: "2026-03-08T05:00:00Z",
    midnight: "2026-03-09T04:00:00Z",
    hours: 23,
    before: ["#A7F3D0", "#2DD4BF", "#0E7490"],
    after: ["#E0F2FE", "#7DD3FC", "#0EA5E9", "#075985"],
  },
  {
    name: "fall",
    start: "2026-11-01T04:00:00Z",
    midnight: "2026-11-02T05:00:00Z",
    hours: 25,
    before: LIONS,
    after: ARCADE,
  },
])("waits $hours hours for the next local midnight across $name DST", async ({
  start,
  midnight,
  hours,
  before,
  after,
}) => {
  const page = await browser.newPage({ timezoneId: "America/New_York", colorScheme: "light" });
  try {
    await page.clock.install({ time: new Date(start) });
    await page.clock.pauseAt(new Date(start));
    await trackRefreshTimeouts(page);
    await page.goto(`${appUrl}#/scorekeepers`);
    await expectColors(scorekeeperStripes(page), before);
    await expectColors(phaseStripes(page), PHASE);
    await expectOneTimeout(page, midnight);
    expect((await refreshTimeouts(page))[0].delay).toBe(hours * 60 * 60 * 1000);
    await page.clock.fastForward(hours * 60 * 60 * 1000 - 1);
    await expectColors(scorekeeperStripes(page), before);
    await page.clock.runFor(1);
    await expectColors(scorekeeperStripes(page), after);
    await expectColors(phaseStripes(page), PHASE);
    await expectOneTimeout(page);
  } finally {
    await page.close();
  }
}, 30_000);

it.each([
  { timezoneId: "America/New_York", scorekeeper: ARCADE, phase: PHASE },
  { timezoneId: "Asia/Tokyo", scorekeeper: HALLOWEEN, phase: HALLOWEEN },
])("uses the device calendar instead of UTC in $timezoneId", async ({
  timezoneId,
  scorekeeper,
  phase,
}) => {
  const page = await browser.newPage({ timezoneId, colorScheme: "light" });
  try {
    await page.clock.setFixedTime(new Date("2026-10-30T16:00:00Z"));
    await page.goto(`${appUrl}#/scorekeepers`);
    await expectColors(scorekeeperStripes(page), scorekeeper);
    await expectColors(phaseStripes(page), phase);
  } finally {
    await page.close();
  }
}, 30_000);

it("keeps fixed 3/4-stripe bands and one shared timer for StrictMode header and chooser previews, then cleans up", async () => {
  const page = await browser.newPage({
    timezoneId: "America/New_York",
    colorScheme: "light",
    viewport: { width: 390, height: 844 },
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    const start = new Date("2026-10-06T16:00:00Z");
    await page.clock.install({ time: start });
    await page.clock.pauseAt(start);
    await trackRefreshTimeouts(page);
    await page.goto(`${appUrl}src/components/Logo/test-fixtures/appearance-counts.html`);
    await page.getByRole("button", { name: "Unmount preview" }).waitFor();
    expect(await page.getByRole("img", { name: "Scorekeeper", exact: true }).count()).toBe(2);
    const before = await lettering(page);
    for (const [colorScheme, colors, count] of [
      ["light", ["#B31942", "#FFFFFF", "#0A3161"], 3],
      ["dark", ["#DC2626", "#16A34A", "#DC2626", "#16A34A"], 4],
      ["light", ["#B31942", "#FFFFFF", "#0A3161"], 3],
    ] as const) {
      await page.emulateMedia({ colorScheme });
      for (const logo of await page.getByRole("img", { name: "Scorekeeper", exact: true }).all()) {
        await expectColors(logo.locator("rect"), colors);
      }
      await expectColors(phaseStripes(page), colors);
      await expectGeometry(page, count);
      expect(await lettering(page)).toEqual(before);
      await expectOneTimeout(page, "2026-10-07T04:00:00Z");
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await expectOneTimeout(page, "2026-10-07T04:00:00Z");
    }
    await page.clock.fastForward(12 * 60 * 60 * 1000);
    await expectOneTimeout(page, "2026-10-08T04:00:00Z");
    await expectGeometry(page, 3);
    // Paused animation frames must not block Playwright's actionability checks.
    await page.getByRole("button", { name: "Unmount preview" }).dispatchEvent("click");
    await expect.poll(async () => (await refreshTimeouts(page)).length).toBe(0);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(await refreshTimeouts(page)).toEqual([]);
    expect(await page.getByRole("img").count()).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    await page.close();
  }
}, 30_000);
