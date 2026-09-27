import type { ActiveGameMetadata, CompletedGameMetadata } from "./gameLifecycle";
import type { GenericPassFailScore, GenericPointsScore } from "./genericRound";
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
}

export interface GenericPassFailSettings extends GenericScoringSettings {
  mode: "passFail";
  tiebreaker: null;
}

export type GenericGameSettings = GenericPointsSettings | GenericPassFailSettings;

interface GenericGameFields {
  scorekeeper: "generic";
  settings: GenericGameSettings;
}

export interface ActiveGenericGame extends ActiveGameMetadata<"generic">, GenericGameFields {}

export interface CompletedGenericGame extends CompletedGameMetadata<"generic">, GenericGameFields {
  completionType: "manual";
}

export type GenericGame = ActiveGenericGame | CompletedGenericGame;

export interface CreateGenericGameInput {
  players: PlayerId[];
  settings: GenericGameSettings;
}

export interface GenericGameView {
  game: GenericGame;
  players: PlayerIdentity[];
}

export interface GenericScoreboardView {
  game: GenericGame;
  primaryLabel: "Points" | "Passes";
  upcomingDealerId: PlayerId | null;
  players: Array<PlayerIdentity & { total: number }>;
  rounds: Array<{
    roundNumber: number;
    dealerId: PlayerId | null;
    scores: Array<(GenericPointsScore | GenericPassFailScore) & { total: number }>;
  }>;
  standings: Array<{ player: PlayerIdentity; total: number; place: number }>;
}
