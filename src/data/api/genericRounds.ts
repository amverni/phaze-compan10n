import type { AddGenericRoundInput, GameId, GenericRound } from "../../types";
import { parseGenericPoints } from "../../utils/genericPoints";
import { getDB } from "../db";
import { requirePlayers, withGameTransaction } from "./gameLifecycle";
import {
  assertGenericPointsGame,
  deriveGenericScoreboard,
  orderGenericScores,
} from "./genericScoring";

export const genericRoundsApi = {
  async add(input: AddGenericRoundInput): Promise<GenericRound> {
    const gameId = input.gameId;
    if (!Array.isArray(input.scores)) {
      throw new Error("A Round must include every Player exactly once.");
    }
    const scores = input.scores.map(({ playerId, points }) => ({
      playerId,
      points: parseGenericPoints(points),
    }));
    return await withGameTransaction(async (tx) => {
      const games = tx.objectStore("games");
      const game = await games.get(gameId);
      if (!game || game.scorekeeper !== "generic") throw new Error("Generic Game not found");
      if (game.status !== "active") throw new Error("Cannot add a Round to a Completed Game");
      assertGenericPointsGame(game);
      const players = await requirePlayers(tx, game.players);
      const rounds = tx.objectStore("rounds");
      const existing = await rounds.index("by-game").getAll(gameId);
      const round: GenericRound = {
        gameId,
        scorekeeper: "generic",
        mode: "points",
        roundNumber: existing.reduce((latest, saved) => Math.max(latest, saved.roundNumber), 0) + 1,
        scores: orderGenericScores(game.players, scores),
      };
      deriveGenericScoreboard(game, players, [...existing, round]);
      await rounds.add(round);
      await games.put({ ...game, lastActivityAt: Date.now() });
      return round;
    });
  },

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
