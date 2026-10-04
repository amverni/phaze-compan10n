import { describe, expect, it } from "vitest";
import { expandPalette, resolveLogoPalette, selectAppearance } from "./resolve";
import type { LogoTheme, LogoThemeConfig } from "./types";

const base = {
  scorekeeper: { light: ["#111", "#222"], dark: ["#AAA", "#BBB", "#CCC"] },
  phaseCompan10n: ["#123", "#456", "#789", "#DEF"],
} as const;
const date = { year: 2026, month: 10, day: 6 };

describe("palette resolution", () => {
  it("expands two colors as ABAB and preserves three, four, and repeated colors", () => {
    expect(expandPalette(["#123", "#456"])).toEqual(["#123", "#456", "#123", "#456"]);
    expect(expandPalette(["#123", "#456", "#789"])).toEqual(["#123", "#456", "#789"]);
    expect(expandPalette(["#123", "#456", "#456", "#123"])).toEqual([
      "#123",
      "#456",
      "#456",
      "#123",
    ]);
    expect(expandPalette(["var(--color-pt-red-500)", "#fff"])).toEqual([
      "var(--color-pt-red-500)",
      "#fff",
      "var(--color-pt-red-500)",
      "#fff",
    ]);
  });

  it("chooses explicit appearances with independent lengths, without changing shared colors", () => {
    const modes = { light: ["#111", "#222"], dark: ["#AAA", "#BBB", "#CCC"] } as const;
    expect(selectAppearance(modes, "light")).toEqual(["#111", "#222"]);
    expect(selectAppearance(modes, "dark")).toEqual(["#AAA", "#BBB", "#CCC"]);
    expect(expandPalette(selectAppearance(modes, "light"))).toEqual([
      "#111",
      "#222",
      "#111",
      "#222",
    ]);
    expect(expandPalette(selectAppearance(modes, "dark"))).toEqual(["#AAA", "#BBB", "#CCC"]);
    const shared = ["#123", "#fff", "#456"] as const;
    expect(selectAppearance(shared, "light")).toEqual(["#123", "#fff", "#456"]);
    expect(selectAppearance(shared, "dark")).toEqual(["#123", "#fff", "#456"]);
  });

  it("falls back separately for each experience and appearance when nothing is scheduled", () => {
    const config = { base, themes: [] } as const satisfies LogoThemeConfig;
    expect(resolveLogoPalette(config, "scorekeeper", date, "light")).toEqual([
      "#111",
      "#222",
      "#111",
      "#222",
    ]);
    expect(resolveLogoPalette(config, "scorekeeper", date, "dark")).toEqual([
      "#AAA",
      "#BBB",
      "#CCC",
    ]);
    expect(resolveLogoPalette(config, "phaseCompan10n", date, "light")).toEqual([
      "#123",
      "#456",
      "#789",
      "#DEF",
    ]);
    expect(resolveLogoPalette(config, "phaseCompan10n", date, "dark")).toEqual([
      "#123",
      "#456",
      "#789",
      "#DEF",
    ]);
    expect(() =>
      resolveLogoPalette(config, "scorekeeper", { year: 2026, month: 2, day: 29 }, "light"),
    ).toThrow("date");
  });

  it("skips inapplicable scopes before choosing the first match", () => {
    const scorekeeper: LogoTheme = {
      colors: ["#111", "#444"],
      scope: "scorekeeper",
      dates: [{ kind: "annual-date", on: "10-06" }],
    };
    const shared: LogoTheme = {
      colors: { light: ["#555", "#666", "#777"], dark: ["#888", "#999"] },
      scope: "all",
      dates: [{ kind: "annual-date", on: "10-06" }],
    };
    const config = { base, themes: [scorekeeper, shared] };
    expect(resolveLogoPalette(config, "scorekeeper", date, "light")).toEqual([
      "#111",
      "#444",
      "#111",
      "#444",
    ]);
    expect(resolveLogoPalette(config, "phaseCompan10n", date, "light")).toEqual([
      "#555",
      "#666",
      "#777",
    ]);
    expect(resolveLogoPalette(config, "phaseCompan10n", date, "dark")).toEqual([
      "#888",
      "#999",
      "#888",
      "#999",
    ]);
    expect(
      resolveLogoPalette({ base, themes: [scorekeeper] }, "phaseCompan10n", date, "light"),
    ).toEqual(["#123", "#456", "#789", "#DEF"]);
  });

  it("uses only configuration order, even when later rules are more specific", () => {
    const broad: LogoTheme = {
      colors: ["#100", "#200"],
      scope: "all",
      dates: [{ kind: "annual-range", from: "01-01", through: "12-31" }],
    };
    const specific: LogoTheme = {
      colors: ["#300", "#400", "#500"],
      scope: "all",
      dates: [{ kind: "date", on: "2026-10-06" }],
    };
    expect(
      resolveLogoPalette({ base, themes: [broad, specific] }, "scorekeeper", date, "light"),
    ).toEqual(["#100", "#200", "#100", "#200"]);
    expect(
      resolveLogoPalette({ base, themes: [specific, broad] }, "scorekeeper", date, "light"),
    ).toEqual(["#300", "#400", "#500"]);
  });

  it("ORs entry rules while ANDing each date with its weekday filter", () => {
    const choice: LogoTheme = {
      colors: ["#100", "#200"],
      scope: "all",
      dates: [
        { kind: "annual-date", on: "01-14" },
        { kind: "annual-range", from: "10-01", through: "10-31", weekdays: ["tuesday"] },
      ],
    };
    const config = { base, themes: [choice] };
    expect(resolveLogoPalette(config, "scorekeeper", date, "light")).toEqual([
      "#100",
      "#200",
      "#100",
      "#200",
    ]);
    expect(
      resolveLogoPalette(config, "scorekeeper", { year: 2026, month: 10, day: 7 }, "light"),
    ).toEqual(["#111", "#222", "#111", "#222"]);
    expect(
      resolveLogoPalette(config, "scorekeeper", { year: 2026, month: 1, day: 14 }, "light"),
    ).toEqual(["#100", "#200", "#100", "#200"]);
    expect(
      resolveLogoPalette(config, "scorekeeper", { year: 2026, month: 11, day: 3 }, "dark"),
    ).toEqual(["#AAA", "#BBB", "#CCC"]);
  });

  it("does not disguise a malformed evaluated rule as a successful base fallback", () => {
    const config: LogoThemeConfig = {
      base,
      themes: [
        {
          colors: ["#100", "#200"],
          scope: "all",
          dates: [{ kind: "date", on: "2026-02-29" }],
        },
      ],
    };
    expect(() => resolveLogoPalette(config, "scorekeeper", date, "light")).toThrow("on");
  });
});
