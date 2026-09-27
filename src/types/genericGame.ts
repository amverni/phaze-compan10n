import type { ActiveGameMetadata, CompletedGameMetadata } from "./gameLifecycle";
import type { PlayerId, PlayerIdentity } from "./player";

export type GenericScoringMode = "points" | "singleRoundWinner" | "passFail";
export type GenericScoreDirection = "high" | "low";

export interface GenericTiebreakerSettings {
  direction: GenericScoreDirection;
}

export interface GenericScoringSettings {
  mode: GenericScoringMode;
  tiebreaker: GenericTiebreakerSettings | null;
  dealer: boolean;
}

export interface GenericPointsSettings extends GenericScoringSettings {
  mode: "points";
  pointsDirection: GenericScoreDirection;
  tiebreaker: null;
  dealer: false;
}

interface GenericGameFields {
  scorekeeper: "generic";
  settings: GenericPointsSettings;
}

export interface ActiveGenericGame extends ActiveGameMetadata<"generic">, GenericGameFields {}

export interface CompletedGenericGame extends CompletedGameMetadata<"generic">, GenericGameFields {
  completionType: "manual";
}

export type GenericGame = ActiveGenericGame | CompletedGenericGame;

export interface CreateGenericGameInput {
  players: PlayerId[];
  settings: GenericPointsSettings;
}

export interface GenericGameView {
  game: GenericGame;
  players: PlayerIdentity[];
}
