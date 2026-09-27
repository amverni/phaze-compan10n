import type { RoundMetadata } from "./gameLifecycle";
import type { GenericRound } from "./genericRound";
import type { PlayerId } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export type Round = PhaseRound;
export type StoredRound = PhaseRound | GenericRound;

export interface PhaseRound extends RoundMetadata {
  scorekeeper: "phase10";
  scores: ArrayAtLeastOne<RoundScore>;
  roundWinnerId: PlayerId;
}

export type PhaseStatus = "failed" | "completed" | "skipped" | "satOut";

export interface RoundScore {
  playerId: PlayerId;
  score: number;
  phaseStatus: PhaseStatus;
  currentPhase: number;
}
