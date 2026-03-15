import type { ArrayAtLeastOne, GameId, Round, RoundScore } from "../../types";
import { getDB } from "../db";

export const roundsApi = {
  /**
   * Get all rounds for a given game, sorted by round number ascending.
   *
   * @param gameId - The unique identifier of the game.
   * @returns An array of rounds belonging to the game.
   */
  async getByGameId(gameId: GameId): Promise<Round[]> {
    const db = await getDB();
    const rounds = await db.getAllFromIndex("rounds", "by-game", gameId);
    return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  },

  /**
   * Add a new round to a game.
   *
   * The round number is automatically assigned as the next sequential number
   * based on the existing rounds for the game.
   *
   * @param data - The round data, excluding `roundNumber` which is generated automatically.
   * @returns The newly created round, including the assigned `roundNumber`.
   */
  async add(data: Omit<Round, "roundNumber">): Promise<Round> {
    const db = await getDB();
    const existing = await db.getAllFromIndex("rounds", "by-game", data.gameId);
    const nextRoundNumber =
      existing.length > 0 ? Math.max(...existing.map((r) => r.roundNumber)) + 1 : 1;

    const round: Round = { ...data, roundNumber: nextRoundNumber };
    await db.add("rounds", round);
    return round;
  },

  /**
   * Edit a single player's score entry within an existing round.
   *
   * Finds the `RoundScore` matching the given `playerId` and merges the
   * provided updates into it.
   *
   * @param gameId - The unique identifier of the game.
   * @param roundNumber - The round number to edit.
   * @param playerId - The player whose score entry should be updated.
   * @param updates - A partial `RoundScore` with the fields to change (excluding `playerId`).
   * @returns The full updated round.
   * @throws {Error} If the round does not exist.
   * @throws {Error} If the player is not found in the round's scores.
   */
  async edit(
    gameId: GameId,
    roundNumber: number,
    playerId: RoundScore["playerId"],
    updates: Partial<Omit<RoundScore, "playerId">>,
  ): Promise<Round> {
    const db = await getDB();
    const round = await db.get("rounds", [gameId, roundNumber]);
    if (!round) throw new Error("Round not found");

    const scoreIndex = round.scores.findIndex((s) => s.playerId === playerId);
    if (scoreIndex === -1) throw new Error("Player not found in round");

    const updatedScores = [...round.scores] as ArrayAtLeastOne<RoundScore>;
    updatedScores[scoreIndex] = { ...updatedScores[scoreIndex], ...updates };

    const updatedRound: Round = { ...round, scores: updatedScores };
    await db.put("rounds", updatedRound);
    return updatedRound;
  },

  /**
   * Delete a single round by its composite key.
   *
   * No error is thrown if the round does not exist.
   *
   * @param gameId - The unique identifier of the game.
   * @param roundNumber - The round number to delete.
   */
  async delete(gameId: GameId, roundNumber: number): Promise<void> {
    const db = await getDB();
    await db.delete("rounds", [gameId, roundNumber]);
  },

  /**
   * Delete all rounds belonging to a game.
   *
   * @param gameId - The unique identifier of the game whose rounds should be deleted.
   */
  async deleteByGameId(gameId: GameId): Promise<void> {
    const db = await getDB();
    const rounds = await db.getAllFromIndex("rounds", "by-game", gameId);
    const tx = db.transaction("rounds", "readwrite");
    await Promise.all([...rounds.map((r) => tx.store.delete([r.gameId, r.roundNumber])), tx.done]);
  },
};
