import { calendarOrdinal, parseFullDate, parseMonthDay } from "./calendar";
import type { LogoThemeConfig, Weekday } from "./types";

const WEEKDAYS: readonly Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

function assertRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "expected an object");
  }
}

function assertArray(value: unknown, path: string): asserts value is readonly unknown[] {
  if (!Array.isArray(value)) fail(path, "expected an array");
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string") fail(path, "expected a string");
}

function assertInteger(
  value: unknown,
  path: string,
  min: number,
  max: number,
): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    fail(path, `expected an integer from ${min} through ${max}`);
  }
}

function checkKeys(
  value: Record<string, unknown>,
  path: string,
  required: readonly string[],
  optional: readonly string[] = [],
): void {
  for (const key of required) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, "required field");
  }
  for (const key of Object.keys(value)) {
    if (!required.includes(key) && !optional.includes(key)) {
      fail(`${path}.${key}`, "unsupported field");
    }
  }
}

function validatePalette(value: unknown, path: string): void {
  assertArray(value, path);
  if (value.length < 2 || value.length > 4) fail(path, "expected 2, 3, or 4 colors");
  for (const [index, color] of value.entries()) {
    const hex =
      typeof color === "string" &&
      (color.length === 4 || color.length === 7) &&
      /^#[\da-f]+$/i.test(color);
    const phaseToken = [
      "var(--color-pt-red-500)",
      "var(--color-pt-blue-500)",
      "var(--color-pt-green-500)",
      "var(--color-pt-yellow-500)",
    ].some((token) => token === color);
    if (!hex && !phaseToken)
      fail(`${path}[${index}]`, "expected #RGB, #RRGGBB, or a Phase base color token");
  }
}

function validatePaletteChoice(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    validatePalette(value, path);
    return;
  }
  assertRecord(value, path);
  checkKeys(value, path, ["light", "dark"]);
  validatePalette(value.light, `${path}.light`);
  validatePalette(value.dark, `${path}.dark`);
}

function validateDateRule(value: unknown, path: string): void {
  assertRecord(value, path);
  if (Object.hasOwn(value, "weekdays")) {
    assertArray(value.weekdays, `${path}.weekdays`);
    if (value.weekdays.length === 0) fail(`${path}.weekdays`, "expected at least one weekday");
    for (const [index, weekday] of value.weekdays.entries()) {
      if (!WEEKDAYS.some((name) => name === weekday)) {
        fail(`${path}.weekdays[${index}]`, "expected a lowercase English weekday");
      }
    }
  }
  switch (value.kind) {
    case "annual-date":
    case "date": {
      checkKeys(value, path, ["kind", "on"], ["weekdays"]);
      assertString(value.on, `${path}.on`);
      if (value.kind === "annual-date") parseMonthDay(value.on, `${path}.on`);
      else parseFullDate(value.on, `${path}.on`);
      return;
    }
    case "annual-range":
    case "range": {
      checkKeys(value, path, ["kind", "from", "through"], ["weekdays"]);
      assertString(value.from, `${path}.from`);
      assertString(value.through, `${path}.through`);
      if (value.kind === "annual-range") {
        parseMonthDay(value.from, `${path}.from`);
        parseMonthDay(value.through, `${path}.through`);
      } else {
        const from = calendarOrdinal(parseFullDate(value.from, `${path}.from`));
        const through = calendarOrdinal(parseFullDate(value.through, `${path}.through`));
        if (from > through) fail(`${path}.through`, "must not precede from");
      }
      return;
    }
    case "annual-weekday-window": {
      checkKeys(
        value,
        path,
        ["kind", "month", "occurrence", "weekday", "fromOffset", "throughOffset"],
        ["weekdays"],
      );
      assertInteger(value.month, `${path}.month`, 1, 12);
      if (value.occurrence !== "last") assertInteger(value.occurrence, `${path}.occurrence`, 1, 5);
      if (!WEEKDAYS.some((name) => name === value.weekday)) {
        fail(`${path}.weekday`, "expected a lowercase English weekday");
      }
      assertInteger(value.fromOffset, `${path}.fromOffset`, -31, 31);
      assertInteger(value.throughOffset, `${path}.throughOffset`, -31, 31);
      if (value.fromOffset > value.throughOffset) {
        fail(`${path}.throughOffset`, "must not precede fromOffset");
      }
      return;
    }
    default:
      fail(`${path}.kind`, "unsupported date rule kind");
  }
}

export function validateLogoThemeConfig(value: unknown): asserts value is LogoThemeConfig {
  assertRecord(value, "config");
  checkKeys(value, "config", ["base", "themes"]);
  assertRecord(value.base, "base");
  checkKeys(value.base, "base", ["scorekeeper", "phaseCompan10n"]);
  validatePaletteChoice(value.base.scorekeeper, "base.scorekeeper");
  validatePaletteChoice(value.base.phaseCompan10n, "base.phaseCompan10n");
  assertArray(value.themes, "themes");
  for (const [index, theme] of value.themes.entries()) {
    const path = `themes[${index}]`;
    assertRecord(theme, path);
    checkKeys(theme, path, ["colors", "scope", "dates"]);
    validatePaletteChoice(theme.colors, `${path}.colors`);
    if (theme.scope !== "all" && theme.scope !== "scorekeeper") {
      fail(`${path}.scope`, 'expected "scorekeeper" or "all"');
    }
    assertArray(theme.dates, `${path}.dates`);
    if (theme.dates.length === 0) fail(`${path}.dates`, "expected at least one date rule");
    for (const [ruleIndex, rule] of theme.dates.entries()) {
      validateDateRule(rule, `${path}.dates[${ruleIndex}]`);
    }
  }
}
