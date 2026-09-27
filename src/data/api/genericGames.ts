import type {
  ActiveGenericGame,
  CreateGenericGameInput,
  GameId,
  GenericGame,
  GenericGameView,
  GenericScoreboardView,
  Player,
  PlayerId,
  StoredGame,
} from "../../types";
import { getDB } from "../db";
import { deleteGameRecords, requirePlayers, withGameTransaction } from "./gameLifecycle";
import {
  assertGenericPointsGame,
  assertGenericPointsSettings,
  deriveGenericScoreboard,
} from "./genericScoring";

export const genericGamesApi = {
  async create(input: CreateGenericGameInput): Promise<ActiveGenericGame> {
    if (!Array.isArray(input.players) || input.players.length === 0) {
      throw new Error("A Generic Game requires at least one Player");
    }
    if (new Set(input.players).size !== input.players.length) {
      throw new Error("Players must be unique");
    }
    const { settings } = input;
    assertGenericPointsSettings(settings);
    const now = Date.now();
    const game: ActiveGenericGame = {
      id: crypto.randomUUID(),
      scorekeeper: "generic",
      status: "active",
      players: [...input.players],
      settings: {
        mode: "points",
        pointsDirection: settings.pointsDirection,
        tiebreaker: null,
        dealer: false,
      },
      createdAt: now,
      lastActivityAt: now,
    };
    await withGameTransaction(async (tx) => {
      await requirePlayers(tx, game.players);
      await tx.objectStore("games").add(game);
    });
    return game;
  },

  async getById(id: GameId): Promise<GenericGame | undefined> {
    const db = await getDB();
    const game = await db.get("games", id);
    return game?.scorekeeper === "generic" ? game : undefined;
  },

  async getDetail(id: GameId): Promise<GenericGameView | null> {
    const db = await getDB();
    const tx = db.transaction(["games", "players"]);
    const game = await tx.objectStore("games").get(id);
    if (!game || game.scorekeeper !== "generic") return null;
    const view = await resolveView(game, (playerId) => tx.objectStore("players").get(playerId));
    await tx.done;
    return view;
  },

  async getScoreboard(id: GameId): Promise<GenericScoreboardView | null> {
    const db = await getDB();
    const tx = db.transaction(["games", "players", "rounds"]);
    const game = await tx.objectStore("games").get(id);
    if (!game || game.scorekeeper !== "generic") return null;
    assertGenericPointsGame(game);
    const [view, rounds] = await Promise.all([
      resolveView(game, (playerId) => tx.objectStore("players").get(playerId)),
      tx.objectStore("rounds").index("by-game").getAll(id),
    ]);
    await tx.done;
    return deriveGenericScoreboard(game, view.players, rounds);
  },

  async getActive(): Promise<ActiveGenericGame[]> {
    const db = await getDB();
    return selectActive(await db.getAllFromIndex("games", "by-status", "active"));
  },

  async getActiveViews(): Promise<GenericGameView[]> {
    const db = await getDB();
    const tx = db.transaction(["games", "players"]);
    const games = selectActive(await tx.objectStore("games").index("by-status").getAll("active"));
    const views = await Promise.all(
      games.map((game) => resolveView(game, (playerId) => tx.objectStore("players").get(playerId))),
    );
    await tx.done;
    return views;
  },

  async delete(id: GameId): Promise<void> {
    await withGameTransaction(async (tx) => {
      const game = await tx.objectStore("games").get(id);
      if (game && game.scorekeeper !== "generic") {
        throw new Error("Game belongs to another Scorekeeper");
      }
      await deleteGameRecords(tx, id);
    });
  },
};

function selectActive(games: StoredGame[]): ActiveGenericGame[] {
  return games
    .filter(
      (game): game is ActiveGenericGame =>
        game.scorekeeper === "generic" && game.status === "active",
    )
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt || b.createdAt - a.createdAt);
}

async function resolveView(
  game: GenericGame,
  loadPlayer: (id: PlayerId) => Promise<Player | undefined>,
): Promise<GenericGameView> {
  const players = await Promise.all(
    game.players.map(async (id) => {
      const player =
        game.status === "completed"
          ? game.playerSnapshots.find((snapshot) => snapshot.id === id)
          : await loadPlayer(id);
      if (!player) throw new Error(`Player no longer exists: ${id}`);
      return player;
    }),
  );
  return { game, players };
}
