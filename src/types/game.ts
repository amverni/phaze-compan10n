import type { TemporaryPhaseSet } from "./phaseSet";
import type { PlayerId } from "./player";

export type Game = ActiveGame | CompletedGame;

export type GameId = string;

export interface ActiveGame extends BaseGame {
  status: "active";
  activePlayers: string[]; // Players actively playing, allows players to be added/removed mid-game
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
  players: string[];
  createdAt: number;
}
