import { palettes } from "./palettes";
import type { LogoThemeConfig, Weekday } from "./types";

const WEEKDAYS: readonly Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const WEEKENDS: readonly Weekday[] = ["saturday", "sunday"];

export const logoThemeConfig = {
  base: { scorekeeper: palettes.arcade, phaseCompan10n: palettes.phaseBase },
  themes: [
    {
      colors: palettes.january14,
      scope: "all",
      dates: [{ kind: "annual-date", on: "01-14" }],
    },
    {
      colors: palettes.september9,
      scope: "all",
      dates: [{ kind: "annual-date", on: "09-09" }],
    },
    {
      colors: palettes.september15,
      scope: "all",
      dates: [{ kind: "annual-date", on: "09-15" }],
    },
    {
      colors: palettes.valentine,
      scope: "all",
      dates: [{ kind: "annual-date", on: "02-14" }],
    },
    {
      colors: palettes.halloween,
      scope: "all",
      dates: [{ kind: "annual-date", on: "10-31" }],
    },
    {
      colors: palettes.christmas,
      scope: "all",
      dates: [{ kind: "annual-range", from: "12-21", through: "12-30" }],
    },
    {
      colors: palettes.newYear,
      scope: "all",
      dates: [{ kind: "annual-range", from: "12-31", through: "01-04" }],
    },
    {
      colors: palettes.thanksgiving,
      scope: "all",
      dates: [
        {
          kind: "annual-weekday-window",
          month: 11,
          occurrence: 4,
          weekday: "thursday",
          fromOffset: -1,
          throughOffset: 1,
        },
      ],
    },
    {
      colors: palettes.usa,
      scope: "all",
      dates: [
        { kind: "annual-range", from: "07-01", through: "07-07" },
        {
          kind: "annual-weekday-window",
          month: 5,
          occurrence: "last",
          weekday: "monday",
          fromOffset: -5,
          throughOffset: 1,
        },
        {
          kind: "annual-weekday-window",
          month: 9,
          occurrence: 1,
          weekday: "monday",
          fromOffset: -5,
          throughOffset: 1,
        },
      ],
    },
    {
      colors: palettes.michigan,
      scope: "scorekeeper",
      dates: [
        {
          kind: "annual-range",
          from: "08-23",
          through: "12-07",
          weekdays: ["saturday"],
        },
      ],
    },
    {
      colors: palettes.lions,
      scope: "scorekeeper",
      dates: [
        {
          kind: "annual-range",
          from: "09-07",
          through: "01-10",
          weekdays: ["sunday"],
        },
      ],
    },
    {
      colors: palettes.openOcean,
      scope: "scorekeeper",
      dates: [{ kind: "annual-range", from: "03-01", through: "05-31", weekdays: WEEKDAYS }],
    },
    {
      colors: palettes.lagoon,
      scope: "scorekeeper",
      dates: [{ kind: "annual-range", from: "03-01", through: "05-31", weekdays: WEEKENDS }],
    },
    {
      colors: palettes.shoreline,
      scope: "scorekeeper",
      dates: [{ kind: "annual-range", from: "06-01", through: "08-31", weekdays: WEEKDAYS }],
    },
    {
      colors: palettes.mountain,
      scope: "scorekeeper",
      dates: [{ kind: "annual-range", from: "06-01", through: "08-31", weekdays: WEEKENDS }],
    },
    {
      colors: palettes.winterForest,
      scope: "scorekeeper",
      dates: [{ kind: "annual-range", from: "12-01", through: "02-29", weekdays: WEEKDAYS }],
    },
    {
      colors: palettes.frost,
      scope: "scorekeeper",
      dates: [{ kind: "annual-range", from: "12-01", through: "02-29", weekdays: WEEKENDS }],
    },
  ],
} as const satisfies LogoThemeConfig;
