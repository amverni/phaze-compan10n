import type { Game } from "./game";
import type { Player } from "./player";
import type { Round } from "./round";

export interface StandingsInput {
  game: Game;
  players: readonly Player[];
  rounds: readonly Round[];
}

export interface StandingsDerivation {
  includedPlayers: Player[];
  rows: StandingsRow[];
  phaseGraphSeries: PhaseGraphSeries[];
  tiebreakerGraphSeries: TiebreakerGraphSeries[];
  hasFinishedPlayers: boolean;
  gameWinner: StandingsRow | null;
}

export interface StandingsRow {
  player: Player;
  place: number;
  showPlace: boolean;
  progress: PlayerProgress;
  tiebreakerTotal: number;
  formattedTiebreaker: string;
}

export interface PlayerProgress {
  currentPhase: number;
  isFinished: boolean;
  standingValue: number;
}

export interface PhaseGraphSeries {
  player: Player;
  points: PhaseGraphPoint[];
}

export interface PhaseGraphPoint extends PlayerProgress {
  roundNumber: number;
}

export interface TiebreakerGraphSeries {
  player: Player;
  points: TiebreakerGraphPoint[];
}

export interface TiebreakerGraphPoint {
  roundNumber: number;
  value: number;
  standingValue: number;
}
