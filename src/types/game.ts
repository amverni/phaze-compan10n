import type { TemporaryPhaseSet } from "./phaseSet";
import type { PlayerId } from "./player";

export type Game = ActiveGame | CompletedGame;

export type GameId = string;

export type GameTiebreaker =
  | "lowestPoints"
  | "highestPoints"
  | "fewestSkips"
  | "mostSkipped"
  | "fewestWilds"
  | "roundsWon";

export interface GameSettings {
  tiebreaker: GameTiebreaker;
  roundSkipPenalty: number; // Default 100. Points added when player takes a Round Skip.
  sitOutPenalty: number; // Default 50. Points added when player Sits Out.
}

export interface ActiveGame extends BaseGame {
  status: "active";
  activePlayers: PlayerId[]; // Players actively playing, allows players to be added/removed mid-game
}

export interface CompletedGame extends BaseGame {
  status: "completed";
  completedAt: number;
  winnerId: PlayerId;
  winnerName: string; // @todo: do we need this to keep track of a winner who was deleted from db? this instead of id?
}

interface BaseGame {
  id: GameId;
  phaseSet: TemporaryPhaseSet;
  players: PlayerId[];
  settings: GameSettings;
  createdAt: number;
  lastActivityAt: number;
}
