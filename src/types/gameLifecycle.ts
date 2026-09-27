import type { PlayerId, PlayerIdentity } from "./player";
import type { ArrayAtLeastOne } from "./utils";

export type ScorekeeperId = "phase10" | "generic";
export type GameId = string;

export interface GameMetadata<TOwner extends ScorekeeperId = ScorekeeperId> {
  id: GameId;
  scorekeeper: TOwner;
  players: PlayerId[];
  createdAt: number;
  lastActivityAt: number;
}

export interface ActiveGameMetadata<TOwner extends ScorekeeperId = ScorekeeperId>
  extends GameMetadata<TOwner> {
  status: "active";
}

export interface CompletedGameMetadata<TOwner extends ScorekeeperId = ScorekeeperId>
  extends GameMetadata<TOwner> {
  status: "completed";
  completedAt: number;
  /** Monotonic per-Scorekeeper retention key; older records fall back to completedAt. */
  completionOrder?: number;
  completionType: "normal" | "manual";
  winnerIds: ArrayAtLeastOne<PlayerId>;
  playerSnapshots: PlayerIdentity[];
}

export interface RoundMetadata {
  scorekeeper: ScorekeeperId;
  gameId: GameId;
  roundNumber: number;
}
