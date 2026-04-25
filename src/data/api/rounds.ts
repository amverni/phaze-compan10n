import type { ArrayAtLeastOne, GameId, PlayerId, Round, RoundScore } from "../../types";
import { getDB } from "../db";

type AddRoundScoreInput = Omit<RoundScore, "currentPhase">;

/**
 * Determine the next `currentPhase` for a player based on their previous
 * round's phase status. Completed or skipped phases advance the player;
 * failed or sat-out phases keep them on the same phase. The result is
 * clamped to `totalPhases` so it never exceeds the game's phase count.
 */
function getNextPhase(previousScore: RoundScore | undefined, totalPhases: number): number {
  if (!previousScore) return 1;

  const advances =
    previousScore.phaseStatus === "completed" || previousScore.phaseStatus === "skipped";

  if (advances) {
    return Math.min(previousScore.currentPhase + 1, totalPhases);
  }
  return previousScore.currentPhase;
}

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
   * The round number is automatically assigned as the next sequential number.
   * Each player's `currentPhase` is automatically computed based on their
   * phase status in the previous round — callers do not provide it.
   *
   * @param data - The round data. Scores should omit `currentPhase` (it is computed).
   * @returns The newly created round.
   * @throws {Error} If the game does not exist.
   */
  async add(data: { gameId: GameId; scores: ArrayAtLeastOne<AddRoundScoreInput> }): Promise<Round> {
    const db = await getDB();

    const game = await db.get("games", data.gameId);
    if (!game) throw new Error("Game not found");

    const totalPhases = game.phaseSet.phases.length;

    const existingRounds = await db.getAllFromIndex("rounds", "by-game", data.gameId);
    const nextRoundNumber =
      existingRounds.length > 0 ? Math.max(...existingRounds.map((r) => r.roundNumber)) + 1 : 1;

    // Find the most recent round to derive each player's currentPhase
    const previousRound =
      existingRounds.length > 0
        ? existingRounds.reduce((latest, r) => (r.roundNumber > latest.roundNumber ? r : latest))
        : undefined;

    const scores = data.scores.map((input) => {
      const prevScore = previousRound?.scores.find((s) => s.playerId === input.playerId);
      return {
        ...input,
        currentPhase: getNextPhase(prevScore, totalPhases),
      };
      // Input guarantees at least one score; .map() preserves length but TS can't infer tuple minimum
    }) as ArrayAtLeastOne<RoundScore>;

    const round: Round = {
      gameId: data.gameId,
      roundNumber: nextRoundNumber,
      scores,
    };
    await db.add("rounds", round);
    return round;
  },

  /**
   * Edit a single player's score entry within an existing round.
   *
   * Finds the `RoundScore` matching the given `playerId` and merges the
   * provided updates into it. The `currentPhase` field cannot be edited
   * directly — it is recomputed automatically.
   *
   * If `phaseStatus` is changed, `currentPhase` is cascade-updated for
   * that player in all subsequent rounds of the same game.
   *
   * @param gameId - The unique identifier of the game.
   * @param roundNumber - The round number to edit.
   * @param playerId - The player whose score entry should be updated.
   * @param updates - A partial `RoundScore` with the fields to change (excluding `playerId` and `currentPhase`).
   * @returns The full updated round.
   * @throws {Error} If the round does not exist.
   * @throws {Error} If the game does not exist.
   * @throws {Error} If the player is not found in the round's scores.
   */
  async edit(
    gameId: GameId,
    roundNumber: number,
    playerId: PlayerId,
    updates: Partial<Omit<RoundScore, "playerId" | "currentPhase">>,
  ): Promise<Round> {
    const db = await getDB();
    const round = await db.get("rounds", [gameId, roundNumber]);
    if (!round) throw new Error("Round not found");

    const scoreIndex = round.scores.findIndex((s) => s.playerId === playerId);
    if (scoreIndex === -1) throw new Error("Player not found in round");

    // Spread preserves minimum length of original; TS can't infer tuple minimum from spread
    const updatedScores = [...round.scores] as ArrayAtLeastOne<RoundScore>;
    updatedScores[scoreIndex] = { ...updatedScores[scoreIndex], ...updates };

    const updatedRound: Round = { ...round, scores: updatedScores };
    await db.put("rounds", updatedRound);

    // If phaseStatus changed, cascade-update currentPhase in subsequent rounds
    if (updates.phaseStatus !== undefined) {
      const game = await db.get("games", gameId);
      if (!game) throw new Error("Game not found");

      const totalPhases = game.phaseSet.phases.length;
      const allRounds = await db.getAllFromIndex("rounds", "by-game", gameId);
      const sorted = allRounds
        .map((r) => (r.roundNumber === roundNumber ? updatedRound : r))
        .sort((a, b) => a.roundNumber - b.roundNumber);

      const laterRounds = sorted.filter((r) => r.roundNumber > roundNumber);
      const tx = db.transaction("rounds", "readwrite");

      let prevRound = updatedRound;
      for (const laterRound of laterRounds) {
        const laterScoreIndex = laterRound.scores.findIndex((s) => s.playerId === playerId);
        if (laterScoreIndex === -1) {
          prevRound = laterRound;
          continue;
        }

        const prevScore = prevRound.scores.find((s) => s.playerId === playerId);
        const newCurrentPhase = getNextPhase(prevScore, totalPhases);

        if (laterRound.scores[laterScoreIndex].currentPhase !== newCurrentPhase) {
          // Spread preserves minimum length of original; TS can't infer tuple minimum from spread
          const newScores = [...laterRound.scores] as ArrayAtLeastOne<RoundScore>;
          newScores[laterScoreIndex] = {
            ...newScores[laterScoreIndex],
            currentPhase: newCurrentPhase,
          };
          const fixedRound: Round = { ...laterRound, scores: newScores };
          await tx.store.put(fixedRound);
          prevRound = fixedRound;
        } else {
          prevRound = laterRound;
        }
      }

      await tx.done;
    }

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
