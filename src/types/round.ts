import type { GameId } from "./game";
import type { PlayerId } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export interface Round {
  gameId: GameId;
  roundNumber: number;
  scores: ArrayAtLeastOne<RoundScore>;
}

export type PhaseStatus = "failed" | "completed" | "skipped" | "satOut";

export interface RoundScore {
  playerId: PlayerId;
  score: number;
  phaseStatus: PhaseStatus;
  currentPhase: number;
}
