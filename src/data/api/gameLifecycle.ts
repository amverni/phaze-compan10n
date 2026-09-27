import type { IDBPTransaction } from "idb";
import type { ActiveGame, CompletedGame, GameId, Player, PlayerId } from "../../types";
import { getDB } from "../db";
import type { Phase10DB } from "../db/schema";

const lifecycleStores = ["games", "players", "rounds", "customPhases", "customPhaseSets"] as const;
export type GameLifecycleTransaction = IDBPTransaction<
  Phase10DB,
  typeof lifecycleStores,
  "readwrite"
>;

export async function withGameTransaction<T>(
  operation: (tx: GameLifecycleTransaction) => Promise<T>,
): Promise<T> {
  const db = await getDB();
  const tx = db.transaction(lifecycleStores, "readwrite");
  // Observe IDB request failures immediately; callers still receive the original error.
  const settled = tx.done.catch((error: unknown) => error);
  try {
    const result = await operation(tx);
    await tx.done;
    return result;
  } catch (error) {
    try {
      tx.abort();
    } catch (abortError) {
      if (!(abortError instanceof DOMException && abortError.name === "InvalidStateError")) {
        throw abortError;
      }
    }
    await settled;
    throw error;
  }
}

export async function finalizeGame(
  tx: GameLifecycleTransaction,
  completed: CompletedGame,
): Promise<void> {
  if ((await tx.objectStore("rounds").index("by-game").count(completed.id)) === 0) {
    throw new Error("A Game needs at least one saved Round before completion");
  }
  await tx.objectStore("games").put(completed);
}

export function requirePlayers(
  tx: GameLifecycleTransaction,
  ids: readonly PlayerId[],
): Promise<Player[]> {
  return Promise.all(
    ids.map(async (id) => {
      const player = await tx.objectStore("players").get(id);
      if (!player) {
        throw new Error(`Player no longer exists: ${id}`);
      }
      return player;
    }),
  );
}

export async function saveActiveGame(
  tx: GameLifecycleTransaction,
  game: ActiveGame,
): Promise<void> {
  if (game.activePlayers.some((id) => !game.players.includes(id))) {
    throw new Error("Active Players must belong to the Game");
  }
  await requirePlayers(tx, game.players);
  await tx.objectStore("games").put(game);
}

export async function deleteGameRecords(tx: GameLifecycleTransaction, id: GameId): Promise<void> {
  const games = tx.objectStore("games");
  const game = await games.get(id);
  const rounds = tx.objectStore("rounds");
  let cursor = await rounds.index("by-game").openCursor(id);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await games.delete(id);
  if (!game) return;

  const remainingGames = await games.getAll();
  const savedSets = await tx.objectStore("customPhaseSets").getAll();
  for (const phaseId of game.phaseSet.phases) {
    const phase = await tx.objectStore("customPhases").get(phaseId);
    if (
      phase?.type === "temporary" &&
      !remainingGames.some((other) => other.phaseSet.phases.includes(phaseId)) &&
      !savedSets.some((set) => set.phases.includes(phaseId))
    ) {
      await tx.objectStore("customPhases").delete(phaseId);
    }
  }
}
