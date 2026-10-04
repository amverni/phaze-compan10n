import type { ScorekeeperExperience } from "../../../types";
import { calendarOrdinal, matchesDateRule } from "./calendar";
import type {
  Appearance,
  CalendarDate,
  LogoThemeConfig,
  Palette,
  PaletteChoice,
  RenderedPalette,
} from "./types";

export function selectAppearance(choice: PaletteChoice, appearance: Appearance): Palette {
  return "light" in choice ? choice[appearance] : choice;
}

export function expandPalette(palette: Palette): RenderedPalette {
  return palette.length === 2 ? [palette[0], palette[1], palette[0], palette[1]] : palette;
}

export function resolveLogoPalette(
  config: LogoThemeConfig,
  experience: ScorekeeperExperience,
  date: CalendarDate,
  appearance: Appearance,
): RenderedPalette {
  calendarOrdinal(date);
  const theme = config.themes.find(
    (entry) =>
      (entry.scope === "all" || experience === "scorekeeper") &&
      entry.dates.some((rule) => matchesDateRule(rule, date)),
  );
  return expandPalette(
    selectAppearance(theme ? theme.colors : config.base[experience], appearance),
  );
}
