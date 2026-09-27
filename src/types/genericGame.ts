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
}

export interface GenericSingleRoundWinnerSettings extends GenericScoringSettings {
  mode: "singleRoundWinner";
  tiebreaker: null;
}

export type GenericGameSettings = GenericPointsSettings | GenericSingleRoundWinnerSettings;

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

export type GenericScoreTotal = { totalPoints: number } | { totalWins: number };

export interface GenericScoreboardView {
  game: GenericGame;
  upcomingDealerId: PlayerId | null;
  players: Array<PlayerIdentity & GenericScoreTotal>;
  rounds: Array<{
    roundNumber: number;
    dealerId: PlayerId | null;
    scores: Array<
      | { playerId: PlayerId; points: number; totalPoints: number }
      | { playerId: PlayerId; won: boolean; totalWins: number }
    >;
  }>;
  standings: Array<{ player: PlayerIdentity; place: number } & GenericScoreTotal>;
}
