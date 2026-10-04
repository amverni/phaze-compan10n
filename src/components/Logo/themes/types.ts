import type { ScorekeeperExperience } from "../../../types";

export type Appearance = "light" | "dark";

export type LogoColor =
  | `#${string}`
  | "var(--color-pt-red-500)"
  | "var(--color-pt-blue-500)"
  | "var(--color-pt-green-500)"
  | "var(--color-pt-yellow-500)";

export type Palette =
  | readonly [LogoColor, LogoColor]
  | readonly [LogoColor, LogoColor, LogoColor]
  | readonly [LogoColor, LogoColor, LogoColor, LogoColor];

export type RenderedPalette =
  | readonly [LogoColor, LogoColor, LogoColor]
  | readonly [LogoColor, LogoColor, LogoColor, LogoColor];

export type PaletteChoice = Palette | Readonly<{ light: Palette; dark: Palette }>;

export type Weekday =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type CalendarDate = Readonly<{ year: number; month: number; day: number }>;

export type DateRule = (
  | Readonly<{ kind: "annual-date"; on: string }>
  | Readonly<{ kind: "annual-range"; from: string; through: string }>
  | Readonly<{ kind: "date"; on: string }>
  | Readonly<{ kind: "range"; from: string; through: string }>
  | Readonly<{
      kind: "annual-weekday-window";
      month: number;
      occurrence: 1 | 2 | 3 | 4 | 5 | "last";
      weekday: Weekday;
      fromOffset: number;
      throughOffset: number;
    }>
) &
  Readonly<{ weekdays?: readonly Weekday[] }>;

export type LogoTheme = Readonly<{
  colors: PaletteChoice;
  scope: "scorekeeper" | "all";
  dates: readonly DateRule[];
}>;

export type LogoThemeConfig = Readonly<{
  base: Readonly<Record<ScorekeeperExperience, PaletteChoice>>;
  themes: readonly LogoTheme[];
}>;

export type ResolvedPalettes = Readonly<Record<ScorekeeperExperience, RenderedPalette>>;
