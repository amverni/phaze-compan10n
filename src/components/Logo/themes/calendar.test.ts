import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calendarOrdinal,
  localCalendarDate,
  matchesDateRule,
  parseFullDate,
  parseMonthDay,
  weekdayNumber,
} from "./calendar";
import type { DateRule } from "./types";

describe("calendar matching", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["America/Los_Angeles", "2026-01-15T01:30:00Z", { year: 2026, month: 1, day: 14 }],
    ["Pacific/Kiritimati", "2026-01-13T12:30:00Z", { year: 2026, month: 1, day: 14 }],
    ["America/Los_Angeles", "2026-03-08T09:30:00Z", { year: 2026, month: 3, day: 8 }],
    ["America/Los_Angeles", "2026-03-08T10:30:00Z", { year: 2026, month: 3, day: 8 }],
  ])("extracts the device-local day in %s, not the UTC day", (zone, instant, expected) => {
    vi.stubEnv("TZ", zone);
    expect(localCalendarDate(new Date(instant))).toEqual(expected);
  });

  it("rejects an invalid supplied Date and exposes strict, path-aware calendar parsing", () => {
    expect(() => localCalendarDate(new Date(Number.NaN))).toThrow("date");
    expect(parseMonthDay("02-29", "rule.on")).toEqual({ month: 2, day: 29 });
    expect(parseFullDate("0000-02-29", "rule.on")).toEqual({ year: 0, month: 2, day: 29 });
    expect(parseFullDate("0099-01-14", "rule.on")).toEqual({ year: 99, month: 1, day: 14 });
    expect(() => parseMonthDay("02-30", "themes[3].dates[0].through")).toThrow(
      "themes[3].dates[0].through",
    );
    expect(() => parseFullDate("2100-02-29", "themes[3].dates[0].on")).toThrow(
      "themes[3].dates[0].on",
    );
    expect(() => parseMonthDay("01-14\n", "on")).toThrow("on");
    expect(calendarOrdinal({ year: 1970, month: 1, day: 1 })).toBe(0);
    expect(calendarOrdinal({ year: 1969, month: 12, day: 31 })).toBe(-1);
    expect(calendarOrdinal({ year: 0, month: 1, day: 1 })).toBe(-719528);
    expect(weekdayNumber("sunday")).toBe(0);
    expect(weekdayNumber("saturday")).toBe(6);
    expect(
      matchesDateRule(
        { kind: "date", on: "0000-01-01", weekdays: ["saturday"] },
        { year: 0, month: 1, day: 1 },
      ),
    ).toBe(true);
  });

  it("matches an annual date only on that local calendar day", () => {
    const rule = { kind: "annual-date", on: "01-14" } as const;
    expect(matchesDateRule(rule, { year: 2026, month: 1, day: 14 })).toBe(true);
    expect(matchesDateRule(rule, { year: 2027, month: 1, day: 14 })).toBe(true);
    expect(matchesDateRule(rule, { year: 2026, month: 1, day: 13 })).toBe(false);
    expect(matchesDateRule(rule, { year: 2026, month: 2, day: 14 })).toBe(false);
  });

  it("rejects impossible calendar dates and malformed annual dates instead of normalizing", () => {
    for (const date of [
      { year: 2026, month: 2, day: 29 },
      { year: 1900, month: 2, day: 29 },
      { year: 2100, month: 2, day: 29 },
      { year: 2026, month: 4, day: 31 },
      { year: 2026, month: 0, day: 1 },
      { year: 2026, month: 13, day: 1 },
      { year: 2026, month: 1, day: 0 },
      { year: 2026.5, month: 1, day: 1 },
      { year: Number.NaN, month: 1, day: 1 },
    ]) {
      expect(() => matchesDateRule({ kind: "annual-date", on: "01-14" }, date)).toThrow("date");
    }
    for (const on of ["1-14", "01-1", "02-30", "04-31", "00-01", "13-01", "01-00", "01-14x"]) {
      expect(() =>
        matchesDateRule({ kind: "annual-date", on }, { year: 2026, month: 1, day: 14 }),
      ).toThrow("on");
    }
    const leapDay = { kind: "annual-date", on: "02-29" } as const;
    expect(matchesDateRule(leapDay, { year: 2000, month: 2, day: 29 })).toBe(true);
    expect(matchesDateRule(leapDay, { year: 2028, month: 2, day: 29 })).toBe(true);
    expect(matchesDateRule(leapDay, { year: 2026, month: 2, day: 28 })).toBe(false);
    expect(matchesDateRule(leapDay, { year: 2026, month: 3, day: 1 })).toBe(false);
  });

  it.each([
    ["12-21", "12-30", 2026, 12, 20, false],
    ["12-21", "12-30", 2026, 12, 21, true],
    ["12-21", "12-30", 2026, 12, 30, true],
    ["12-21", "12-30", 2026, 12, 31, false],
    ["12-31", "01-04", 2026, 12, 30, false],
    ["12-31", "01-04", 2026, 12, 31, true],
    ["12-31", "01-04", 2027, 1, 1, true],
    ["12-31", "01-04", 2027, 1, 4, true],
    ["12-31", "01-04", 2027, 1, 5, false],
    ["01-14", "01-14", 2026, 1, 13, false],
    ["01-14", "01-14", 2026, 1, 14, true],
    ["01-14", "01-14", 2026, 1, 15, false],
    ["12-01", "02-29", 2026, 2, 28, true],
    ["12-01", "02-29", 2026, 3, 1, false],
    ["12-01", "02-29", 2028, 2, 29, true],
    ["12-01", "02-29", 2100, 2, 28, true],
    ["12-01", "02-29", 2100, 3, 1, false],
  ] as const)("annual range %s–%s on %i-%i-%i is %s", (from, through, year, month, day, expected) => {
    expect(matchesDateRule({ kind: "annual-range", from, through }, { year, month, day })).toBe(
      expected,
    );
  });

  it("keeps explicit dates and inclusive ranges tied to their specified years", () => {
    const single = { kind: "date", on: "2027-12-25" } as const;
    expect(matchesDateRule(single, { year: 2027, month: 12, day: 25 })).toBe(true);
    expect(matchesDateRule(single, { year: 2026, month: 12, day: 25 })).toBe(false);
    const range = { kind: "range", from: "2026-12-31", through: "2027-01-04" } as const;
    for (const [year, month, day, expected] of [
      [2026, 12, 30, false],
      [2026, 12, 31, true],
      [2027, 1, 1, true],
      [2027, 1, 4, true],
      [2027, 1, 5, false],
      [2027, 12, 31, false],
    ] as const) {
      expect(matchesDateRule(range, { year, month, day })).toBe(expected);
    }
    const equal = { kind: "range", from: "2027-12-25", through: "2027-12-25" } as const;
    expect(matchesDateRule(equal, { year: 2027, month: 12, day: 25 })).toBe(true);
    expect(matchesDateRule(equal, { year: 2027, month: 12, day: 24 })).toBe(false);
    expect(matchesDateRule(equal, { year: 2027, month: 12, day: 26 })).toBe(false);
    expect(
      matchesDateRule({ kind: "date", on: "0000-02-29" }, { year: 0, month: 2, day: 29 }),
    ).toBe(true);
    expect(
      matchesDateRule({ kind: "date", on: "0099-01-14" }, { year: 99, month: 1, day: 14 }),
    ).toBe(true);
    for (const on of [
      "2026-02-29",
      "1900-02-29",
      "2100-02-29",
      "2026-04-31",
      "2026-1-14",
      "026-01-14",
      "10000-01-14",
      "2026-01-14T00:00:00Z",
      "2026-01-14\n",
    ]) {
      expect(() =>
        matchesDateRule({ kind: "date", on }, { year: 2026, month: 1, day: 14 }),
      ).toThrow("on");
    }
  });

  it.each([
    ["Memorial Day", 5, "last", "monday", -5, 1, [19, 20, 25, 26, 27]],
    ["Labor Day", 9, 1, "monday", -5, 1, [1, 2, 7, 8, 9]],
    ["Thanksgiving", 11, 4, "thursday", -1, 1, [24, 25, 26, 27, 28]],
  ] as const)("matches the literal 2026 %s window, including endpoints but not neighboring days", (_name, month, occurrence, weekday, fromOffset, throughOffset, days) => {
    const rule: DateRule = {
      kind: "annual-weekday-window",
      month,
      occurrence,
      weekday,
      fromOffset,
      throughOffset,
    };
    expect(matchesDateRule(rule, { year: 2026, month, day: days[0] })).toBe(false);
    expect(matchesDateRule(rule, { year: 2026, month, day: days[1] })).toBe(true);
    expect(matchesDateRule(rule, { year: 2026, month, day: days[2] })).toBe(true);
    expect(matchesDateRule(rule, { year: 2026, month, day: days[3] })).toBe(true);
    expect(matchesDateRule(rule, { year: 2026, month, day: days[4] })).toBe(false);
  });

  it("uses neighboring anchor years for windows crossing New Year", () => {
    const december: DateRule = {
      kind: "annual-weekday-window",
      month: 12,
      occurrence: "last",
      weekday: "thursday",
      fromOffset: 0,
      throughOffset: 2,
    };
    expect(matchesDateRule(december, { year: 2027, month: 1, day: 2 })).toBe(true);
    expect(matchesDateRule(december, { year: 2027, month: 1, day: 3 })).toBe(false);
    const january: DateRule = {
      kind: "annual-weekday-window",
      month: 1,
      occurrence: 1,
      weekday: "friday",
      fromOffset: -2,
      throughOffset: 0,
    };
    expect(matchesDateRule(january, { year: 2026, month: 12, day: 29 })).toBe(false);
    expect(matchesDateRule(january, { year: 2026, month: 12, day: 30 })).toBe(true);
    expect(matchesDateRule(january, { year: 2027, month: 1, day: 1 })).toBe(true);
    expect(matchesDateRule(january, { year: 2027, month: 1, day: 2 })).toBe(false);
  });

  it("does not roll nonexistent fifth weekdays into the next month", () => {
    const rule: DateRule = {
      kind: "annual-weekday-window",
      month: 2,
      occurrence: 5,
      weekday: "monday",
      fromOffset: -31,
      throughOffset: 31,
    };
    expect(matchesDateRule(rule, { year: 2026, month: 2, day: 23 })).toBe(false);
    expect(matchesDateRule(rule, { year: 2026, month: 3, day: 2 })).toBe(false);
    expect(matchesDateRule(rule, { year: 2044, month: 2, day: 29 })).toBe(true);
    expect(matchesDateRule(rule, { year: 2044, month: 1, day: 29 })).toBe(true);
    expect(matchesDateRule(rule, { year: 2044, month: 1, day: 28 })).toBe(false);
    expect(matchesDateRule(rule, { year: 2044, month: 3, day: 31 })).toBe(true);
    expect(matchesDateRule(rule, { year: 2044, month: 4, day: 1 })).toBe(false);
  });

  it.each([
    { kind: "annual-date", on: "10-31" },
    { kind: "annual-range", from: "10-30", through: "11-01" },
    { kind: "date", on: "2026-10-31" },
    { kind: "range", from: "2026-10-30", through: "2026-11-01" },
    {
      kind: "annual-weekday-window",
      month: 10,
      occurrence: "last",
      weekday: "saturday",
      fromOffset: -1,
      throughOffset: 1,
    },
  ] as const)("ANDs the optional weekday filter with a $kind rule", (rule) => {
    expect(
      matchesDateRule({ ...rule, weekdays: ["friday"] }, { year: 2026, month: 10, day: 31 }),
    ).toBe(false);
    expect(
      matchesDateRule(
        { ...rule, weekdays: ["friday", "saturday"] },
        { year: 2026, month: 10, day: 31 },
      ),
    ).toBe(true);
    expect(
      matchesDateRule({ ...rule, weekdays: ["saturday"] }, { year: 2026, month: 11, day: 7 }),
    ).toBe(false);
  });
});
