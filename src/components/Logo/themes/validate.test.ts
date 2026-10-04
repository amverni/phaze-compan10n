import { describe, expect, it } from "vitest";
import { validateLogoThemeConfig } from "./validate";

const bases = {
  scorekeeper: ["#123", "#ABC"],
  phaseCompan10n: ["#123456", "#aBcDeF", "#fff"],
};
const theme = {
  colors: ["#123", "#456"],
  scope: "all",
  dates: [{ kind: "annual-date", on: "01-14" }],
};
const anchor = {
  kind: "annual-weekday-window",
  month: 5,
  occurrence: "last",
  weekday: "monday",
  fromOffset: -5,
  throughOffset: 1,
};

function configWithTheme(value: unknown): unknown {
  return { base: bases, themes: [value] };
}

function configWithRule(value: unknown): unknown {
  return configWithTheme({ ...theme, dates: [value] });
}

describe("unknown logo configuration validation", () => {
  it("accepts separate bases with an empty theme list and narrows unknown input", () => {
    const value: unknown = { base: bases, themes: [] };
    validateLogoThemeConfig(value);
    expect(value.base.scorekeeper).toEqual(["#123", "#ABC"]);
    expect(value.themes).toEqual([]);
  });

  it.each([
    [null, "config"],
    [[], "config"],
    ["config", "config"],
    [{}, "base"],
    [{ base: null, themes: [] }, "base"],
    [{ base: {}, themes: [] }, "base.scorekeeper"],
    [{ base: { scorekeeper: ["#123", "#456"] }, themes: [] }, "base.phaseCompan10n"],
    [{ base: bases }, "themes"],
    [{ base: bases, themes: null }, "themes"],
    [{ base: bases, themes: {} }, "themes"],
    [configWithTheme(null), "themes[0]"],
    [configWithTheme({ ...theme, scope: "phaseCompan10n" }), "themes[0].scope"],
    [configWithTheme({ ...theme, dates: [] }), "themes[0].dates"],
    [configWithTheme({ ...theme, dates: "01-14" }), "themes[0].dates"],
    [configWithTheme({ ...theme, name: "special" }), "themes[0].name"],
    [configWithTheme({ ...theme, priority: 1 }), "themes[0].priority"],
    [configWithTheme({ scope: "all", dates: theme.dates }), "themes[0].colors"],
  ])("rejects malformed structure at %s with path %s", (value, path) => {
    expect(() => validateLogoThemeConfig(value)).toThrow(path);
  });

  it("accepts each palette length, exact Phase tokens, repetitions and independent appearances", () => {
    for (const colors of [
      ["#abc", "#123456"],
      ["#abc", "#123456", "#ABCDEF"],
      ["#abc", "#123456", "#123456", "#abc"],
      [
        "var(--color-pt-red-500)",
        "var(--color-pt-blue-500)",
        "var(--color-pt-green-500)",
        "var(--color-pt-yellow-500)",
      ],
      { light: ["#abc", "#123456"], dark: ["#abc", "#123456", "#ABCDEF"] },
      { light: ["#abc", "#123456", "#ABCDEF"], dark: ["#abc", "#123456", "#ABCDEF", "#fff"] },
    ]) {
      expect(() =>
        validateLogoThemeConfig({
          base: { scorekeeper: colors, phaseCompan10n: colors },
          themes: [{ ...theme, colors }],
        }),
      ).not.toThrow();
    }
  });

  it.each([
    [null, "colors"],
    ["#123", "colors"],
    [[], "colors"],
    [["#123"], "colors"],
    [["#123", "#456", "#789", "#ABC", "#DEF"], "colors"],
    [["#123", "red"], "colors[1]"],
    [["#123", "#12"], "colors[1]"],
    [["#123", "#1234"], "colors[1]"],
    [["#123", "#12345678"], "colors[1]"],
    [["#123", "#gggggg"], "colors[1]"],
    [["#123", "#abc\n"], "colors[1]"],
    [["#123", "#ab\n"], "colors[1]"],
    [["#123", "#12345\n"], "colors[1]"],
    [["#123", " #abc"], "colors[1]"],
    [["#123", "var(--color-pt-red-400)"], "colors[1]"],
    [["#123", "var(--color-pt-purple-500)"], "colors[1]"],
    [["#123", "var(--color-pt-RED-500)"], "colors[1]"],
    [["#123", "var(--color-pt-red-500, #fff)"], "colors[1]"],
    [["#123", 123], "colors[1]"],
    [{ light: ["#123", "#456"] }, "colors.dark"],
    [{ dark: ["#123", "#456"] }, "colors.light"],
    [{ light: ["#123", "#456"], dark: null }, "colors.dark"],
    [{ light: ["#123", "#456"], dark: ["#123", "#456"], other: [] }, "colors.other"],
    [{ light: ["#123", "#456"], dark: ["#123", "#456", "white"] }, "colors.dark[2]"],
  ])("rejects an invalid palette %s at %s", (colors, path) => {
    expect(() => validateLogoThemeConfig(configWithTheme({ ...theme, colors }))).toThrow(
      `themes[0].${path}`,
    );
  });

  it("reports the base appearance and color index without accepting sparse palettes", () => {
    const sparseColors = new Array<unknown>(3);
    sparseColors[0] = "#123";
    sparseColors[2] = "#456";
    expect(() =>
      validateLogoThemeConfig({
        base: {
          ...bases,
          scorekeeper: { light: ["#123", "#456"], dark: ["#123", "#456", "white"] },
        },
        themes: [],
      }),
    ).toThrow("base.scorekeeper.dark[2]");
    expect(() =>
      validateLogoThemeConfig(
        configWithTheme({
          ...theme,
          colors: sparseColors,
        }),
      ),
    ).toThrow("themes[0].colors[1]");
  });

  it("accepts annual wrapping, leap endpoints, equal dates, overlapping and duplicate rules", () => {
    const rules = [
      { kind: "annual-date", on: "02-29", weekdays: ["monday", "monday"] },
      { kind: "annual-range", from: "12-01", through: "02-29" },
      { kind: "annual-range", from: "01-14", through: "01-14" },
      { kind: "date", on: "0000-02-29" },
      { kind: "date", on: "2000-02-29" },
      { kind: "range", from: "0099-12-31", through: "0100-01-01" },
      { kind: "range", from: "2028-02-29", through: "2028-02-29" },
    ];
    const overlapping = { ...theme, dates: [...rules, ...rules] };
    expect(() =>
      validateLogoThemeConfig({
        base: bases,
        themes: [overlapping, overlapping],
      }),
    ).not.toThrow();
  });

  it.each([
    [null, ""],
    [[], ""],
    [{}, ".kind"],
    [{ kind: "holiday", on: "01-14" }, ".kind"],
    [{ kind: "annual-date" }, ".on"],
    [{ kind: "annual-date", on: 114 }, ".on"],
    [{ kind: "annual-date", on: "2026-01-14" }, ".on"],
    [{ kind: "annual-date", on: "02-30" }, ".on"],
    [{ kind: "annual-date", on: "1-14" }, ".on"],
    [{ kind: "annual-date", on: "01-14", priority: 1 }, ".priority"],
    [{ kind: "annual-date", on: "01-14", through: "01-15" }, ".through"],
    [{ kind: "annual-range", from: "01-01" }, ".through"],
    [{ kind: "annual-range", from: "04-31", through: "05-10" }, ".from"],
    [{ kind: "annual-range", from: "01-01", through: "02-30" }, ".through"],
    [{ kind: "date", on: "2026-02-29" }, ".on"],
    [{ kind: "date", on: "1900-02-29" }, ".on"],
    [{ kind: "date", on: "2100-02-29" }, ".on"],
    [{ kind: "date", on: "2026-1-14" }, ".on"],
    [{ kind: "range", from: "2027-01-04", through: "2026-12-31" }, ".through"],
    [{ kind: "range", from: "2026-02-29", through: "2026-12-31" }, ".from"],
    [{ kind: "range", from: "2026-01-01", through: "2026-02-29" }, ".through"],
    [{ kind: "date", on: "2026-01-14", weekdays: [] }, ".weekdays"],
    [{ kind: "date", on: "2026-01-14", weekdays: "wednesday" }, ".weekdays"],
    [{ kind: "date", on: "2026-01-14", weekdays: ["Wednesday"] }, ".weekdays[0]"],
    [{ kind: "date", on: "2026-01-14", weekdays: ["wednesday", 4] }, ".weekdays[1]"],
    [{ kind: "date", on: "2026-01-14", weekdays: ["mercredi"] }, ".weekdays[0]"],
    [{ kind: "date", on: "2026-01-14", weekdays: undefined }, ".weekdays"],
  ])("rejects invalid date rule %s at %s", (rule, field) => {
    expect(() => validateLogoThemeConfig(configWithRule(rule))).toThrow(
      `themes[0].dates[0]${field}`,
    );
  });

  it("keeps deep locations and rejects sparse rules and weekday filters", () => {
    expect(() =>
      validateLogoThemeConfig({
        base: bases,
        themes: [
          theme,
          theme,
          theme,
          { ...theme, dates: [{ kind: "annual-range", from: "01-01", through: "02-30" }] },
        ],
      }),
    ).toThrow("themes[3].dates[0].through");
    expect(() =>
      validateLogoThemeConfig(configWithTheme({ ...theme, dates: new Array(1) })),
    ).toThrow("themes[0].dates[0]");
    expect(() =>
      validateLogoThemeConfig(
        configWithRule({
          kind: "annual-date",
          on: "01-14",
          weekdays: new Array(1),
        }),
      ),
    ).toThrow("themes[0].dates[0].weekdays[0]");
  });

  it("accepts first through fifth and last anchors, all months, and inclusive offset bounds", () => {
    for (const occurrence of [1, 2, 3, 4, 5, "last"]) {
      for (const month of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
        expect(() =>
          validateLogoThemeConfig(
            configWithRule({
              ...anchor,
              occurrence,
              month,
              fromOffset: -31,
              throughOffset: 31,
              weekdays: [
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
              ],
            }),
          ),
        ).not.toThrow();
      }
    }
    expect(() =>
      validateLogoThemeConfig(
        configWithRule({
          ...anchor,
          fromOffset: 0,
          throughOffset: 0,
        }),
      ),
    ).not.toThrow();
  });

  it.each([
    ["month", 0],
    ["month", 13],
    ["month", 1.5],
    ["month", "5"],
    ["occurrence", 0],
    ["occurrence", 6],
    ["occurrence", 1.5],
    ["occurrence", "first"],
    ["occurrence", "LAST"],
    ["weekday", "Monday"],
    ["weekday", 1],
    ["weekday", "weekday"],
    ["fromOffset", -32],
    ["fromOffset", 32],
    ["fromOffset", -1.5],
    ["fromOffset", Number.NaN],
    ["fromOffset", Number.POSITIVE_INFINITY],
    ["fromOffset", "-1"],
    ["throughOffset", -32],
    ["throughOffset", 32],
    ["throughOffset", 1.5],
    ["throughOffset", null],
    ["throughOffset", -6],
    ["on", "05-25"],
  ])("rejects invalid anchor field %s = %s", (field, value) => {
    expect(() => validateLogoThemeConfig(configWithRule({ ...anchor, [field]: value }))).toThrow(
      `themes[0].dates[0].${field}`,
    );
  });

  it("requires every anchor field", () => {
    for (const field of ["month", "occurrence", "weekday", "fromOffset", "throughOffset"]) {
      const missing = Object.fromEntries(Object.entries(anchor).filter(([key]) => key !== field));
      expect(() => validateLogoThemeConfig(configWithRule(missing))).toThrow(
        `themes[0].dates[0].${field}`,
      );
    }
  });
});
