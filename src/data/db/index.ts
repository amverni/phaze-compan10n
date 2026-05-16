import { type IDBPDatabase, type IDBPTransaction, openDB, type StoreNames } from "idb";
import type { Meld, Phase, PhaseStatus, Round, RoundScore } from "../../types";
import type { Phase10DB } from "./schema";

let dbInstance: IDBPDatabase<Phase10DB> | null = null;

export async function getDB(): Promise<IDBPDatabase<Phase10DB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<Phase10DB>("phase10-db", 6, {
    async upgrade(
      db: IDBPDatabase<Phase10DB>,
      oldVersion: number,
      _newVersion: number | null,
      transaction: IDBPTransaction<Phase10DB, StoreNames<Phase10DB>[], "versionchange">,
    ): Promise<void> {
      // Create players store
      if (!db.objectStoreNames.contains("players")) {
        const playerStore = db.createObjectStore("players", { keyPath: "id" });
        playerStore.createIndex("by-isFavorite", "isFavorite");
      }

      // Create games store
      if (!db.objectStoreNames.contains("games")) {
        const gameStore = db.createObjectStore("games", { keyPath: "id" });
        gameStore.createIndex("by-created", "createdAt");
        gameStore.createIndex("by-status", "status");
      }

      await migrateRoundsStore(db, transaction);

      // Create customPhases store
      if (!db.objectStoreNames.contains("customPhases")) {
        const customPhasesStore = db.createObjectStore("customPhases", { keyPath: "id" });
        customPhasesStore.createIndex("by-type", "type");
      } else if (!transaction.objectStore("customPhases").indexNames.contains("by-type")) {
        transaction.objectStore("customPhases").createIndex("by-type", "type");
      }
      if (oldVersion < 5 && db.objectStoreNames.contains("customPhases")) {
        await migrateLegacyCustomPhaseMelds(transaction);
      }

      // Create customPhaseSets store
      if (!db.objectStoreNames.contains("customPhaseSets")) {
        db.createObjectStore("customPhaseSets", { keyPath: "id" });
      }

      // Create favorites store
      if (!db.objectStoreNames.contains("favorites")) {
        const favoritesStore = db.createObjectStore("favorites", {
          keyPath: ["entityType", "entityId"],
        });
        favoritesStore.createIndex("by-type", "entityType");
      }

      // Create settings store
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    },
  });

  return dbInstance;
}

// Helper to close DB (useful for testing or cleanup)
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

type LegacyRoundScore = Omit<RoundScore, "phaseStatus"> & {
  phaseStatus?: PhaseStatus;
  completedPhase?: boolean;
};

type LegacyRound = Omit<Round, "scores" | "roundWinnerId"> & {
  scores: [LegacyRoundScore, ...LegacyRoundScore[]];
  roundWinnerId?: string;
};

type LegacyColorMeld = Omit<Extract<Meld, { type: "colorGroup" }>, "type"> & {
  type: "group" | "colorGroup";
};

type LegacyMeld = Exclude<Meld, { type: "colorGroup" }> | LegacyColorMeld;

type LegacyPhase = Omit<Phase, "requirements"> & {
  requirements: [LegacyMeld, ...LegacyMeld[]];
};

async function migrateRoundsStore(
  db: IDBPDatabase<Phase10DB>,
  transaction: IDBPTransaction<Phase10DB, StoreNames<Phase10DB>[], "versionchange">,
): Promise<void> {
  if (!db.objectStoreNames.contains("rounds")) {
    const roundStore = db.createObjectStore("rounds", {
      keyPath: ["gameId", "roundNumber"],
    });
    roundStore.createIndex("by-game", "gameId");
    return;
  }

  const existingStore = transaction.objectStore("rounds");
  const hasCompositeKey =
    Array.isArray(existingStore.keyPath) &&
    existingStore.keyPath.length === 2 &&
    existingStore.keyPath[0] === "gameId" &&
    existingStore.keyPath[1] === "roundNumber";

  const legacyRounds = (await existingStore.getAll()) as unknown as LegacyRound[];
  const migratedRounds = legacyRounds.map(migrateLegacyRound);

  if (hasCompositeKey) {
    if (!existingStore.indexNames.contains("by-game")) {
      existingStore.createIndex("by-game", "gameId");
    }
    await Promise.all(migratedRounds.map((round) => existingStore.put(round)));
    return;
  }

  db.deleteObjectStore("rounds");
  const roundStore = db.createObjectStore("rounds", {
    keyPath: ["gameId", "roundNumber"],
  });
  roundStore.createIndex("by-game", "gameId");
  await Promise.all(migratedRounds.map((round) => roundStore.add(round)));
}

function migrateLegacyRound(round: LegacyRound): Round {
  const scores = round.scores.map((score) => ({
    playerId: score.playerId,
    score: score.score,
    currentPhase: score.currentPhase,
    phaseStatus: score.phaseStatus ?? (score.completedPhase ? "completed" : "failed"),
  })) as Round["scores"];

  return {
    gameId: round.gameId,
    roundNumber: round.roundNumber,
    scores,
    roundWinnerId: round.roundWinnerId ?? inferRoundWinnerId(scores),
  };
}

/**
 * Heuristic used when migrating legacy rounds that predate `roundWinnerId`:
 * the player whose `phaseStatus === "completed"` has the unique minimum
 * `score` (Phase 10 convention: the player who goes out scores 0). Falls
 * back to the first score's `playerId` so the field is never empty.
 */
function inferRoundWinnerId(scores: Round["scores"]): string {
  const completed = scores.filter((s) => s.phaseStatus === "completed");
  if (completed.length > 0) {
    const minScore = Math.min(...completed.map((s) => s.score));
    const atMin = completed.filter((s) => s.score === minScore);
    if (atMin.length === 1) return atMin[0].playerId;
  }
  return scores[0].playerId;
}

async function migrateLegacyCustomPhaseMelds(
  transaction: IDBPTransaction<Phase10DB, StoreNames<Phase10DB>[], "versionchange">,
): Promise<void> {
  const store = transaction.objectStore("customPhases");
  const phases = (await store.getAll()) as unknown as LegacyPhase[];
  await Promise.all(
    phases.map((phase) => {
      const migrated = {
        ...phase,
        requirements: phase.requirements.map((requirement) =>
          requirement.type === "group"
            ? { ...requirement, type: "colorGroup" as const }
            : requirement,
        ) as Phase["requirements"],
      };
      return store.put(migrated);
    }),
  );
}
