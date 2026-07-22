import type { Game, GameId } from "../../types";

export function shouldAutoOpenStandings(
  status: Game["status"],
  gameId: GameId,
  autoOpenedGameId: GameId | null,
): boolean {
  return status === "completed" && autoOpenedGameId !== gameId;
}
