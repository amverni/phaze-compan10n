import type { GameId, RoundMetadata } from "./gameLifecycle";
import type { PlayerId } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export interface GenericPointsScore {
  playerId: PlayerId;
  points: number;
}

export interface GenericPassFailScore {
  playerId: PlayerId;
  passed: boolean;
}

export interface GenericPointsRound extends RoundMetadata {
  scorekeeper: "generic";
  mode: "points";
  scores: ArrayAtLeastOne<GenericPointsScore>;
}

export interface GenericPassFailRound extends RoundMetadata {
  scorekeeper: "generic";
  mode: "passFail";
  scores: ArrayAtLeastOne<GenericPassFailScore>;
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

export type GenericRound =
  | GenericPointsRound
  | GenericSingleRoundWinnerRound
  | GenericPassFailRound;

export interface AddGenericPointsRoundInput {
  gameId: GameId;
  mode?: "points";
  scores: { playerId: PlayerId; points: string }[];
}

export interface AddGenericPassFailRoundInput {
  gameId: GameId;
  mode: "passFail";
  scores: GenericPassFailScore[];
}

export interface AddGenericWinnerRoundInput {
  gameId: GameId;
  mode: "singleRoundWinner";
  scores: GenericWinnerScore[];
}

export type AddGenericRoundInput =
  | AddGenericPointsRoundInput
  | AddGenericWinnerRoundInput
  | AddGenericPassFailRoundInput;
