import type { GameSettings, GameTiebreaker } from "../../types";

export const TIEBREAKER_VALUES = [
  "lowestPoints",
  "highestPoints",
  "fewestSkips",
  "mostSkipped",
  "fewestWilds",
  "roundsWon",
] as const satisfies ReadonlyArray<GameTiebreaker>;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  tiebreaker: "lowestPoints",
};

export const TIEBREAKER_LABELS = {
  lowestPoints: "Lowest Points",
  highestPoints: "Highest Points",
  fewestSkips: "Fewest Skips",
  mostSkipped: "Most Skipped",
  fewestWilds: "Fewest Wilds",
  roundsWon: "Rounds Won",
} satisfies Record<GameTiebreaker, string>;

export const TIEBREAKER_OPTIONS: ReadonlyArray<{ value: GameTiebreaker; label: string }> =
  TIEBREAKER_VALUES.map((value) => ({ value, label: TIEBREAKER_LABELS[value] }));

function isGameTiebreaker(value: string | undefined): value is GameTiebreaker {
  return typeof value && TIEBREAKER_VALUES.includes(value as GameTiebreaker);
}

export function normalizeGameSettings(settings?: Partial<GameSettings>): GameSettings {
  return {
    tiebreaker: isGameTiebreaker(settings?.tiebreaker)
      ? settings.tiebreaker
      : DEFAULT_GAME_SETTINGS.tiebreaker,
  };
}
