import type { GameId } from "./gameLifecycle";
import type { PlayerIdentity } from "./player";

export interface GameListItem {
  id: GameId;
  name?: string;
  status: "active" | "completed";
  lastActivityAt: number;
  players: PlayerIdentity[];
}
