import type { GameId, GenericRound } from "../../types";
import { getDB } from "../db";

export const genericRoundsApi = {
  async getByGameId(gameId: GameId): Promise<GenericRound[]> {
    const db = await getDB();
    const tx = db.transaction(["games", "rounds"]);
    const game = await tx.objectStore("games").get(gameId);
    if (game?.scorekeeper !== "generic") return [];
    const rounds = await tx.objectStore("rounds").index("by-game").getAll(gameId);
    await tx.done;
    return rounds
      .filter((round) => round.scorekeeper === "generic")
      .sort((a, b) => a.roundNumber - b.roundNumber);
  },

  async hasRounds(gameId: GameId): Promise<boolean> {
    return (await this.getByGameId(gameId)).length > 0;
  },
};
