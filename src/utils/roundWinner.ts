import type { GameTiebreaker, PhaseStatus } from "../types";

export function getRoundWinnerRequirement(
  tiebreaker: GameTiebreaker,
  results: readonly (PhaseStatus | null)[],
): "required" | "optional" | "disabled" {
  if (
    results.length > 0 &&
    results.every((result) => result === "skipped" || result === "satOut")
  ) {
    return "disabled";
  }

  return tiebreaker === "roundsWon" ? "required" : "optional";
}
