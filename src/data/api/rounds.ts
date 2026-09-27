import type {
  ArrayAtLeastOne,
  CompletedGame,
  GameId,
  Player,
  PlayerId,
  Round,
  RoundScore,
} from "../../types";
import { getNextCurrentPhase } from "../../utils";
import { getDB } from "../db";
import { withGameDefaults } from "./gameDefaults";
import { resolveGameCompletion } from "./roundCompletion";

type AddRoundScoreInput = Omit<RoundScore, "currentPhase">;

export interface AddRoundAddedResult {
  outcome: "roundAdded";
  round: Round;
}

export interface AddRoundCompletedResult {
  outcome: "gameCompleted";
  round: Round;
  completedGame: CompletedGame;
  gameWinner: Player;
}

export type AddRoundResult = AddRoundAddedResult | AddRoundCompletedResult;

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

  async hasRounds(gameId: GameId): Promise<boolean> {
    const db = await getDB();
    const rounds = await db.getAllFromIndex("rounds", "by-game", gameId);
    return rounds.length > 0;
  },

  /**
   * Add a new round to a game.
   *
   * The round number is automatically assigned as the next sequential number.
   * Each player's `currentPhase` is automatically computed based on their
   * phase status in the previous round — callers do not provide it.
   *
   * @param data - The round data. Scores should omit `currentPhase` (it is computed).
   *   `roundWinnerId` is required and identifies the player who went out.
   * @returns The newly created round and completion details when this round finishes the game.
   * @throws {Error} If the game does not exist.
   */
  async add(data: {
    gameId: GameId;
    scores: ArrayAtLeastOne<AddRoundScoreInput>;
    roundWinnerId: PlayerId;
  }): Promise<AddRoundResult> {
    const db = await getDB();

    const tx = db.transaction(["games", "players", "rounds"], "readwrite");
    const gamesStore = tx.objectStore("games");
    const playersStore = tx.objectStore("players");
    const roundsStore = tx.objectStore("rounds");

    const existingGame = await gamesStore.get(data.gameId);
    const existing = existingGame ? withGameDefaults(existingGame) : undefined;
    if (!existing) throw new Error("Game not found");
    if (existing.status === "completed") throw new Error("Cannot add a round to a completed game");

    const game = existing;
    const totalPhases = game.phaseSet.phases.length;
    const now = Date.now();

    const existingRounds = await roundsStore.index("by-game").getAll(data.gameId);
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
        currentPhase: getNextCurrentPhase(prevScore, totalPhases),
      };
      // Input guarantees at least one score; .map() preserves length but TS can't infer tuple minimum
    }) as ArrayAtLeastOne<RoundScore>;

    const round: Round = {
      gameId: data.gameId,
      roundNumber: nextRoundNumber,
      scores,
      roundWinnerId: data.roundWinnerId,
    };

    const activeGameWithActivity = { ...game, lastActivityAt: now };
    const players = (
      await Promise.all(game.players.map((playerId) => playersStore.get(playerId)))
    ).filter((player): player is Player => player !== undefined);
    const completion = resolveGameCompletion({
      game: activeGameWithActivity,
      players,
      rounds: [...existingRounds, round],
      completedAt: now,
    });

    await roundsStore.add(round);
    if (completion) {
      await gamesStore.put(completion.completedGame);
    } else {
      await gamesStore.put(activeGameWithActivity);
    }
    await tx.done;

    if (completion) {
      return {
        outcome: "gameCompleted",
        round,
        completedGame: completion.completedGame,
        gameWinner: completion.gameWinner,
      };
    }

    return {
      outcome: "roundAdded",
      round,
    };
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
    const tx = db.transaction(["games", "rounds"], "readwrite");
    const roundsStore = tx.objectStore("rounds");
    const round = await roundsStore.get([gameId, roundNumber]);
    if (!round) throw new Error("Round not found");

    const scoreIndex = round.scores.findIndex((s) => s.playerId === playerId);
    if (scoreIndex === -1) throw new Error("Player not found in round");

    // Spread preserves minimum length of original; TS can't infer tuple minimum from spread
    const updatedScores = [...round.scores] as ArrayAtLeastOne<RoundScore>;
    updatedScores[scoreIndex] = { ...updatedScores[scoreIndex], ...updates };

    const updatedRound: Round = { ...round, scores: updatedScores };
    const game =
      updates.phaseStatus !== undefined ? await tx.objectStore("games").get(gameId) : undefined;
    if (updates.phaseStatus !== undefined && !game) throw new Error("Game not found");

    await roundsStore.put(updatedRound);

    // If phaseStatus changed, cascade-update currentPhase in subsequent rounds
    if (updates.phaseStatus !== undefined && game) {
      const totalPhases = game.phaseSet.phases.length;
      const allRounds = await roundsStore.index("by-game").getAll(gameId);
      const sorted = allRounds
        .map((r) => (r.roundNumber === roundNumber ? updatedRound : r))
        .sort((a, b) => a.roundNumber - b.roundNumber);

      const laterRounds = sorted.filter((r) => r.roundNumber > roundNumber);

      let prevRound = updatedRound;
      for (const laterRound of laterRounds) {
        const laterScoreIndex = laterRound.scores.findIndex((s) => s.playerId === playerId);
        if (laterScoreIndex === -1) {
          prevRound = laterRound;
          continue;
        }

        const prevScore = prevRound.scores.find((s) => s.playerId === playerId);
        const newCurrentPhase = getNextCurrentPhase(prevScore, totalPhases);

        if (laterRound.scores[laterScoreIndex].currentPhase !== newCurrentPhase) {
          // Spread preserves minimum length of original; TS can't infer tuple minimum from spread
          const newScores = [...laterRound.scores] as ArrayAtLeastOne<RoundScore>;
          newScores[laterScoreIndex] = {
            ...newScores[laterScoreIndex],
            currentPhase: newCurrentPhase,
          };
          const fixedRound: Round = { ...laterRound, scores: newScores };
          await roundsStore.put(fixedRound);
          prevRound = fixedRound;
        } else {
          prevRound = laterRound;
        }
      }
    }

    await tx.done;
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
    const rounds = await db.getAllFromIndex("rounds", "by-game", gameId);
    const round = rounds.find((candidate) => candidate.roundNumber === roundNumber);
    if (!round) return;

    const latestRoundNumber = Math.max(...rounds.map((candidate) => candidate.roundNumber));
    if (roundNumber !== latestRoundNumber) {
      throw new Error("Only the latest round can be deleted");
    }

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
