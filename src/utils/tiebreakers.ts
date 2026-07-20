import type { GameTiebreaker, PlayerId, Round, RoundScore } from "../types";

type TiebreakerValueSource = "score" | "roundWinner";

interface TiebreakerRule {
  direction: "lower" | "higher";
  valueSource: TiebreakerValueSource;
  singularUnit: string;
  pluralUnit: string;
}

const TIEBREAKER_RULES = {
  lowestPoints: {
    direction: "lower",
    valueSource: "score",
    singularUnit: "pts",
    pluralUnit: "pts",
  },
  highestPoints: {
    direction: "higher",
    valueSource: "score",
    singularUnit: "pts",
    pluralUnit: "pts",
  },
  fewestSkips: {
    direction: "lower",
    valueSource: "score",
    singularUnit: "skip card",
    pluralUnit: "skip cards",
  },
  mostSkipped: {
    direction: "higher",
    valueSource: "score",
    singularUnit: "time skipped",
    pluralUnit: "times skipped",
  },
  fewestWilds: {
    direction: "lower",
    valueSource: "score",
    singularUnit: "wild",
    pluralUnit: "wilds",
  },
  roundsWon: {
    direction: "higher",
    valueSource: "roundWinner",
    singularUnit: "win",
    pluralUnit: "wins",
  },
} satisfies Record<GameTiebreaker, TiebreakerRule>;

export function formatTiebreakerValue(value: number, tiebreaker: GameTiebreaker): string {
  const rule = TIEBREAKER_RULES[tiebreaker];
  return `${value} ${value === 1 ? rule.singularUnit : rule.pluralUnit}`;
}

export function getRoundTiebreakerValue(
  round: Round,
  playerId: PlayerId,
  tiebreaker: GameTiebreaker,
  score: RoundScore | undefined,
): number {
  if (!score) return 0;

  if (TIEBREAKER_RULES[tiebreaker].valueSource === "roundWinner") {
    return round.roundWinnerId === playerId ? 1 : 0;
  }

  return score.score ?? 0;
}

export function isLowerBetterTiebreaker(tiebreaker: GameTiebreaker): boolean {
  return TIEBREAKER_RULES[tiebreaker].direction === "lower";
}

export function toTiebreakerStandingValue(value: number, tiebreaker: GameTiebreaker): number {
  if (value === 0) return 0;
  return isLowerBetterTiebreaker(tiebreaker) ? -value : value;
}
