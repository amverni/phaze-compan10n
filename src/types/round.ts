import type { GameId } from "./game";
import type { PlayerId } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export interface Round {
  gameId: GameId;
  roundNumber: number;
  scores: ArrayAtLeastOne<RoundScore>;
}

interface RoundScore {
  playerId: PlayerId;
  score: number;
  completedPhase: boolean;
  currentPhase: number;
}
