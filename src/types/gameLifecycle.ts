import type { PlayerId, PlayerIdentity } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export type ScorekeeperId = "phase10";
export type GameId = string;

export interface GameMetadata {
  id: GameId;
  scorekeeper: ScorekeeperId;
  players: PlayerId[];
  createdAt: number;
  lastActivityAt: number;
}

export interface ActiveGameMetadata extends GameMetadata {
  status: "active";
}

export interface CompletedGameMetadata extends GameMetadata {
  status: "completed";
  completedAt: number;
  completionType: "normal" | "manual";
  winnerIds: ArrayAtLeastOne<PlayerId>;
  playerSnapshots: PlayerIdentity[];
}

export interface RoundMetadata {
  scorekeeper: ScorekeeperId;
  gameId: GameId;
  roundNumber: number;
}
