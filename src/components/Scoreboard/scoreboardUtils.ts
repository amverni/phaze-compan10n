import type { GameTiebreaker, PlayerId, Round } from "../../types";
import { formatTiebreakerValue, getNextCurrentPhase, getRoundTiebreakerValue } from "../../utils";

/**
 * Returns the player id whose turn it is to deal round `roundNumber` (1-indexed).
 * Dealer rotation is deterministic from `activePlayers` order: round 1 → first
 * player, round 2 → second, … wrapping when it reaches the end of the list.
 *
 * If `activePlayers` is empty the function returns `null` (caller should treat
 * as "no dealer chip").
 */
export function getDealerId(
  roundNumber: number,
  activePlayers: readonly PlayerId[],
): PlayerId | null {
  if (activePlayers.length === 0) return null;
  const idx =
    (((roundNumber - 1) % activePlayers.length) + activePlayers.length) % activePlayers.length;
  return activePlayers[idx];
}

/**
 * Returns the phase a player will be on for the next (not-yet-played) round.
 *
 * Implementation: read the player's `currentPhase` from the most recent round
 * in `rounds`, then apply the shared Current Phase advancement rule.
 * Defaults to `1` when there are no rounds and is
 * clamped to `totalPhases`.
 */
export function getCurrentPhase(
  playerId: PlayerId,
  rounds: readonly Round[],
  totalPhases: number,
): number {
  if (rounds.length === 0) return 1;
  const latest = rounds.reduce((acc, r) => (r.roundNumber > acc.roundNumber ? r : acc));
  const score = latest.scores.find((s) => s.playerId === playerId);
  return getNextCurrentPhase(score, totalPhases);
}

/**
 * Per-round tiebreaker contribution for one player, using the shared
 * tiebreaker rules so Scoreboard and Standings stay consistent.
 */
export function getTiebreakerValue(
  round: Round,
  playerId: PlayerId,
  tiebreaker: GameTiebreaker,
): number {
  const score = round.scores.find((s) => s.playerId === playerId);
  return getRoundTiebreakerValue(round, playerId, tiebreaker, score);
}

/**
 * Sum of per-round contributions across rounds with `roundNumber <= throughRoundNumber`.
 * `rounds` may be passed in any order.
 */
export function getRunningTiebreakerTotal(
  rounds: readonly Round[],
  playerId: PlayerId,
  tiebreaker: GameTiebreaker,
  throughRoundNumber: number,
): number {
  let total = 0;
  for (const round of rounds) {
    if (round.roundNumber > throughRoundNumber) continue;
    total += getTiebreakerValue(round, playerId, tiebreaker);
  }
  return total;
}

/** Format a tiebreaker value with units. E.g. `(43, "lowestPoints") -> "43 pts"`. */
export function formatTiebreaker(value: number, tiebreaker: GameTiebreaker): string {
  return formatTiebreakerValue(value, tiebreaker);
}
