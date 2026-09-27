import type { ActiveGame, CreateGameInput, Game, GameId, PhaseId, PlayerId } from "../../types";
import { getDB } from "../db";
import {
  deleteGameRecords,
  finalizeGame,
  requirePlayers,
  saveActiveGame,
  withGameTransaction,
} from "./gameLifecycle";
import { resolveGameCompletion } from "./roundCompletion";

export const gamesApi = {
  async getAll(): Promise<Game[]> {
    const db = await getDB();
    const games = await db.getAll("games");
    return games.filter((game) => game.scorekeeper === "phase10").sort(byLastActivityDesc);
  },

  async getActive(): Promise<ActiveGame[]> {
    const db = await getDB();
    const games = await db.getAllFromIndex("games", "by-status", "active");
    return games
      .filter(
        (game): game is ActiveGame => game.status === "active" && game.scorekeeper === "phase10",
      )
      .sort(byLastActivityDesc);
  },

  async getById(id: GameId): Promise<Game | undefined> {
    const db = await getDB();
    const game = await db.get("games", id);
    return game?.scorekeeper === "phase10" ? game : undefined;
  },

  async create(data: CreateGameInput): Promise<ActiveGame> {
    const now = Date.now();
    const newGame: ActiveGame = {
      ...data,
      scorekeeper: "phase10",
      id: crypto.randomUUID(),
      status: "active",
      createdAt: now,
      lastActivityAt: now,
      activePlayers: data.players,
    };
    await withGameTransaction(async (tx) => {
      await requirePlayers(tx, newGame.players);
      await tx.objectStore("games").add(newGame);
    });
    return newGame;
  },

  async addPhase(gameId: GameId, phaseId: PhaseId): Promise<void> {
    await withGameTransaction(async (tx) => {
      const game = await tx.objectStore("games").get(gameId);
      assertActivePhaseGame(game);
      await saveActiveGame(tx, {
        ...game,
        phaseSet: { ...game.phaseSet, phases: [...game.phaseSet.phases, phaseId] },
      });
    });
  },

  async removePhase(gameId: GameId, phaseId: PhaseId): Promise<void> {
    await withGameTransaction(async (tx) => {
      const game = await tx.objectStore("games").get(gameId);
      assertActivePhaseGame(game);
      const phaseIndex = game.phaseSet.phases.indexOf(phaseId);
      if (phaseIndex === -1) throw new Error("Phase not found in game");
      if (game.phaseSet.phases.length === 1) {
        throw new Error("Cannot remove the last phase from a game");
      }
      if ((await tx.objectStore("rounds").index("by-game").count(gameId)) > 0) {
        throw new Error("Cannot remove phases after rounds have been recorded");
      }
      const phases = game.phaseSet.phases.filter((_, index) => index !== phaseIndex);
      const [first, ...rest] = phases;
      if (!first) throw new Error("Cannot remove the last phase from a game");
      await saveActiveGame(tx, {
        ...game,
        phaseSet: { ...game.phaseSet, phases: [first, ...rest] },
      });
    });
  },

  // Compatibility for the existing API, not an Early Finish path. New completion
  // modes must resolve their winners and use the same finalizeGame transaction.
  async complete(id: GameId, winnerId: PlayerId): Promise<void> {
    await withGameTransaction(async (tx) => {
      const game = await tx.objectStore("games").get(id);
      assertActivePhaseGame(game);
      const players = await requirePlayers(tx, game.players);
      const rounds = await tx.objectStore("rounds").index("by-game").getAll(id);
      const completion = resolveGameCompletion({ game, players, rounds, completedAt: Date.now() });
      if (!completion || completion.gameWinner.id !== winnerId) {
        throw new Error("Game has no matching normal completion winner");
      }
      await finalizeGame(tx, completion.completedGame);
    });
  },

  async delete(id: GameId): Promise<void> {
    await withGameTransaction(async (tx) => {
      const game = await tx.objectStore("games").get(id);
      if (game && game.scorekeeper !== "phase10")
        throw new Error("Game belongs to another Scorekeeper");
      await deleteGameRecords(tx, id);
    });
  },
};

function byLastActivityDesc(a: Game, b: Game): number {
  return b.lastActivityAt - a.lastActivityAt || b.createdAt - a.createdAt;
}

export function assertActivePhaseGame(game: Game | undefined): asserts game is ActiveGame {
  if (!game || game.scorekeeper !== "phase10") throw new Error("Phase 10 Game not found");
  if (game.status === "completed") throw new Error("Cannot update a completed game");
}
