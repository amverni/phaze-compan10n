import type {
  ActiveGame,
  ArrayAtLeastOne,
  CompletedGame,
  Game,
  GameId,
  GameSettings,
  PhaseId,
  PlayerId,
  TemporaryPhaseSet,
} from "../../types";
import { normalizeGameSettings } from "../constants/gameSettings";
import { getDB } from "../db";
import { phasesApi } from "./phases";
import { roundsApi } from "./rounds";

export const gamesApi = {
  /**
   * Get all games.
   * Results are sorted by last activity (most recent first); ties fall back to creation date.
   */
  async getAll(): Promise<Game[]> {
    const db = await getDB();
    const games = await db.getAll("games");
    return games.map(withGameDefaults).sort(byLastActivityDesc);
  },

  /**
   * Get active (in-progress) games only.
   *
   * Results are sorted by last activity (most recent first); ties fall back to creation date.
   *
   * @returns An array of games with status `"active"`.
   */
  getActive(): Promise<ActiveGame[]> {
    return getByStatus("active");
  },

  /**
   * Get a single game by its unique ID.
   *
   * @param id - The unique identifier of the game to retrieve.
   * @returns The game if found, or `undefined` if no game exists with the given ID.
   */
  async getById(id: GameId): Promise<Game | undefined> {
    const db = await getDB();
    const game = await db.get("games", id);
    return game ? withGameDefaults(game) : undefined;
  },

  /**
   * Create a new game.
   *
   * Automatically generates a unique ID (UUID v4), sets the `createdAt` timestamp,
   * marks the status as `"active"`, and initializes `activePlayers` from the provided player list.
   *
   * @param data - The game data, excluding `id`, `createdAt`, `status`, and `activePlayers` which are generated automatically.
   * @returns The newly created game.
   */
  async create(
    data: Omit<ActiveGame, "id" | "createdAt" | "lastActivityAt" | "status" | "activePlayers">,
  ): Promise<ActiveGame> {
    const db = await getDB();
    const now = Date.now();
    const newGame: ActiveGame = {
      ...data,
      id: crypto.randomUUID(),
      status: "active",
      createdAt: now,
      lastActivityAt: now,
      activePlayers: data.players,
    };
    await db.add("games", newGame);
    return newGame;
  },

  /**
   * Add a phase to a game's phase set.
   *
   * Appends the given phase to the end of the game's current phase list.
   *
   * @param gameId - The unique identifier of the game to modify.
   * @param phaseId - The phase to add to the game's phase set.
   * @throws {Error} If the game does not exist.
   */
  async addPhase(gameId: GameId, phaseId: PhaseId): Promise<void> {
    const db = await getDB();
    const game = await db.get("games", gameId);
    if (!game) throw new Error("Game not found");

    const updatedPhaseSet: TemporaryPhaseSet = {
      ...game.phaseSet,
      phases: [...game.phaseSet.phases, phaseId],
    };

    await update(gameId, { phaseSet: updatedPhaseSet });
  },

  /**
   * Remove a phase from a game's phase set.
   *
   * The last remaining phase cannot be removed.
   *
   * @param gameId - The unique identifier of the game to modify.
   * @param phaseId - The phase to remove from the game's phase set.
   * @throws {Error} If the game does not exist.
   * @throws {Error} If the phase is not in the game's phase set.
   * @throws {Error} If the phase is the last one in the set.
   */
  async removePhase(gameId: GameId, phaseId: PhaseId): Promise<void> {
    const db = await getDB();
    const game = await db.get("games", gameId);
    if (!game) throw new Error("Game not found");
    if (game.status === "completed") throw new Error("Cannot update a completed game");

    const phases = game.phaseSet.phases;
    if (!phases.includes(phaseId)) throw new Error("Phase not found in game");

    if (phases.length === 1) throw new Error("Cannot remove the last phase from a game");

    if (await roundsApi.hasRounds(gameId)) {
      throw new Error("Cannot remove phases after rounds have been recorded");
    }

    const nextPhases = [...phases] as PhaseId[];
    const phaseIndex = nextPhases.indexOf(phaseId);
    nextPhases.splice(phaseIndex, 1);

    const updatedPhaseSet: TemporaryPhaseSet = {
      ...game.phaseSet,
      phases: nextPhases as ArrayAtLeastOne<PhaseId>,
    };

    await update(gameId, { phaseSet: updatedPhaseSet });
  },

  /**
   * Mark a game as completed with a winner.
   *
   * Transitions the game's status to `"completed"`, records the winner's ID and
   * name, and sets the `completedAt` timestamp.
   *
   * @param id - The unique identifier of the game to complete.
   * @param winnerId - The unique identifier of the winning player.
   * @throws {Error} If the game does not exist.
   * @throws {Error} If the winner player does not exist.
   */
  async complete(id: GameId, winnerId: PlayerId): Promise<void> {
    const db = await getDB();
    const existingGame = await db.get("games", id);
    const existing = existingGame ? withGameDefaults(existingGame) : undefined;
    if (!existing) throw new Error("Game not found");
    if (!existing.players.includes(winnerId)) throw new Error("Winner is not in this game");
    if (existing.status === "active" && !existing.activePlayers.includes(winnerId)) {
      throw new Error("Winner is not an active player in this game");
    }

    const winnerName = await db.get("players", winnerId).then((p) => p?.name);
    if (!winnerName) throw new Error("Winner player not found");

    const completed: CompletedGame = {
      ...existing,
      status: "completed",
      completedAt: Date.now(),
      winnerId,
      winnerName,
    };

    await db.put("games", completed);
  },

  /**
   * Delete a game by ID.
   *
   * Removes the game record from the database and deletes any temporary
   * phases associated with the game. No error is thrown if the game does
   * not exist.
   *
   * @param id - The unique identifier of the game to delete.
   */
  async delete(id: GameId): Promise<void> {
    const db = await getDB();
    const game = await db.get("games", id);
    const temporaryPhaseIds: PhaseId[] = [];

    if (game) {
      const phases = await phasesApi.getByIds(game.phaseSet.phases);
      temporaryPhaseIds.push(...phases.filter((p) => p.type === "temporary").map((p) => p.id));
    }

    const rounds = await db.getAllFromIndex("rounds", "by-game", id);
    const tx = db.transaction(["customPhases", "games", "rounds"], "readwrite");
    await Promise.all([
      ...temporaryPhaseIds.map((phaseId) => tx.objectStore("customPhases").delete(phaseId)),
      ...rounds.map((round) => tx.objectStore("rounds").delete([round.gameId, round.roundNumber])),
      tx.objectStore("games").delete(id),
      tx.done,
    ]);
  },
};

type LegacyActiveGame = Omit<ActiveGame, "settings" | "lastActivityAt"> & {
  settings?: Partial<GameSettings>;
  lastActivityAt?: number;
};
type LegacyCompletedGame = Omit<CompletedGame, "settings" | "lastActivityAt"> & {
  settings?: Partial<GameSettings>;
  lastActivityAt?: number;
};
type LegacyGame = LegacyActiveGame | LegacyCompletedGame;

/**
 * Get games filtered by their status.
 *
 * Results are sorted by last activity (most recent first); ties fall back to creation date.
 *
 * @param status - The game status to filter by (e.g. `"active"`, `"completed"`).
 * @returns An array of games matching the given status, narrowed to the appropriate Game union member.
 */
async function getByStatus<GameStatus extends Game["status"]>(
  status: GameStatus,
): Promise<Extract<Game, { status: GameStatus }>[]> {
  const db = await getDB();
  const games = await db.getAllFromIndex("games", "by-status", status);
  return games.map(withGameDefaults).sort(byLastActivityDesc) as Extract<
    Game,
    { status: GameStatus }
  >[];
}

function byLastActivityDesc(a: Game, b: Game): number {
  if (b.lastActivityAt !== a.lastActivityAt) return b.lastActivityAt - a.lastActivityAt;
  return b.createdAt - a.createdAt;
}

function withGameDefaults(game: LegacyGame): Game {
  const settings = normalizeGameSettings(game.settings);
  const lastActivityAt = game.lastActivityAt ?? game.createdAt;

  if (game.status === "active") return { ...game, settings, lastActivityAt };
  return { ...game, settings, lastActivityAt };
}

/**
 * Update an active game with a partial set of changes.
 *
 * Merges the provided updates into the existing game record. The `id` and
 * `createdAt` fields cannot be changed. Completed games cannot be updated.
 *
 * @param id - The unique identifier of the game to update.
 * @param updates - A partial object containing the fields to update.
 * @throws {Error} If the game does not exist.
 * @throws {Error} If the game has already been completed.
 */
async function update(
  id: GameId,
  updates: Partial<Omit<ActiveGame, "id" | "createdAt">>,
): Promise<void> {
  const db = await getDB();
  const existingGame = await db.get("games", id);
  const existing = existingGame ? withGameDefaults(existingGame) : undefined;
  if (!existing) throw new Error("Game not found");

  if (existing.status === "completed") throw new Error("Cannot update a completed game");

  const updated: ActiveGame = { ...existing, ...updates };
  await db.put("games", updated);
}
