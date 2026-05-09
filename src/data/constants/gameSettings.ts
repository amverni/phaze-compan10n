import type { GameSettings, GameTiebreaker } from "../../types";

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  tiebreaker: "lowestPoints",
};

export const TIEBREAKER_LABELS = {
  lowestPoints: "Lowest Points",
  highestPoints: "Highest Points",
  fewestSkips: "Fewest Skips",
  mostSkipped: "Most Skipped",
  fewestWilds: "Fewest Wilds",
} satisfies Record<GameTiebreaker, string>;

export const TIEBREAKER_OPTIONS: ReadonlyArray<{ value: GameTiebreaker; label: string }> = [
  { value: "lowestPoints", label: TIEBREAKER_LABELS.lowestPoints },
  { value: "highestPoints", label: TIEBREAKER_LABELS.highestPoints },
  { value: "fewestSkips", label: TIEBREAKER_LABELS.fewestSkips },
  { value: "mostSkipped", label: TIEBREAKER_LABELS.mostSkipped },
  { value: "fewestWilds", label: TIEBREAKER_LABELS.fewestWilds },
];
