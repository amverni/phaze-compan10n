import type { GameId, RoundMetadata } from "./gameLifecycle";
import type { PlayerId } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export interface GenericPointsScore {
  playerId: PlayerId;
  points: number;
}

export interface GenericPointsRound extends RoundMetadata {
  scorekeeper: "generic";
  mode: "points";
  scores: ArrayAtLeastOne<GenericPointsScore>;
}

export interface GenericWinnerScore {
  playerId: PlayerId;
  won: boolean;
}

export interface GenericSingleRoundWinnerRound extends RoundMetadata {
  scorekeeper: "generic";
  mode: "singleRoundWinner";
  scores: ArrayAtLeastOne<GenericWinnerScore>;
}

export type GenericRound = GenericPointsRound | GenericSingleRoundWinnerRound;

export interface AddGenericPointsRoundInput {
  gameId: GameId;
  mode?: "points";
  scores: { playerId: PlayerId; points: string }[];
}

export interface AddGenericWinnerRoundInput {
  gameId: GameId;
  mode: "singleRoundWinner";
  scores: GenericWinnerScore[];
}

export type AddGenericRoundInput = AddGenericPointsRoundInput | AddGenericWinnerRoundInput;
