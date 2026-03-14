import { type IDBPDatabase, openDB } from "idb";
import type { Phase10DB } from "./schema";

let dbInstance: IDBPDatabase<Phase10DB> | null = null;

export async function getDB(): Promise<IDBPDatabase<Phase10DB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<Phase10DB>("phase10-db", 1, {
    upgrade(db: IDBPDatabase<Phase10DB>): void {
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

      // Create rounds store
      if (!db.objectStoreNames.contains("rounds")) {
        const roundStore = db.createObjectStore("rounds", { keyPath: "id" });
        roundStore.createIndex("by-game", "gameId");
      }

      // Create customPhases store
      if (!db.objectStoreNames.contains("customPhases")) {
        db.createObjectStore("customPhases", { keyPath: "id" });
      }

      // Create customPhaseSets store
      if (!db.objectStoreNames.contains("customPhaseSets")) {
        db.createObjectStore("customPhaseSets", { keyPath: "id" });
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
