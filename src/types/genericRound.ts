import type { GameId, RoundMetadata } from "./gameLifecycle";
import type { PlayerId } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export interface GenericPointsScore {
  playerId: PlayerId;
  points: number;
}

export interface GenericRound extends RoundMetadata {
  scorekeeper: "generic";
  mode: "points";
  scores: ArrayAtLeastOne<GenericPointsScore>;
}

export interface AddGenericRoundInput {
  gameId: GameId;
  scores: { playerId: PlayerId; points: string }[];
}
