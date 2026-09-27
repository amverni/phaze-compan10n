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

export type GenericRound = GenericPointsRound | GenericPassFailRound;

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

export type AddGenericRoundInput = AddGenericPointsRoundInput | AddGenericPassFailRoundInput;
