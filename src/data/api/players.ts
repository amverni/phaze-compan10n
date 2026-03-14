import type { Player } from "../../types";
import type { PlayerId } from "../../types/player";
import { getDB } from "../db";
import { nameMatchScore } from "./utils";

export const playersApi = {
  /**
   * Get all players, optionally filtered by favorite status and/or name.
   *
   * @param filters - Optional filters to narrow results.
   * @param filters.isFavorite - Filter by favorite status using the `by-isFavorite` index. `1` for favorites, `0` for non-favorites.
   * @param filters.name - Filter by name substring match. Results are sorted by match quality:
   *   - Name starts with search string (best)
   *   - Any word starts with search string
   *   - Contains search string
   * @returns The matching players, sorted by name relevance when a name filter is provided.
   */
  async getAll(filters?: { isFavorite?: 0 | 1; name?: string }): Promise<Player[]> {
    const db = await getDB();

    let players: Player[];

    if (filters?.isFavorite !== undefined) {
      players = await db.getAllFromIndex("players", "by-isFavorite", filters.isFavorite);
    } else {
      players = await db.getAll("players");
    }

    if (filters?.name) {
      const search = filters.name.toLowerCase();
      players = players
        .filter((p) => p.name.toLowerCase().includes(search))
        .sort((a, b) => nameMatchScore(b.name, search) - nameMatchScore(a.name, search));
    }

    return players;
  },

  /**
   * Get a single player by their unique ID.
   *
   * @param id - The unique identifier of the player to retrieve.
   * @returns The player if found, or `undefined` if no player exists with the given ID.
   */
  async getById(id: PlayerId): Promise<Player | undefined> {
    const db = await getDB();
    return db.get("players", id);
  },

  /**
   * Get multiple players by their IDs.
   *
   * Players that are not found are silently excluded from the result.
   *
   * @param ids - An array of player IDs to look up.
   * @returns An array of found players. The order is not guaranteed to match the input order.
   */
  async getByIds(ids: PlayerId[]): Promise<Player[]> {
    const db = await getDB();
    const players = await Promise.all(ids.map((id) => db.get("players", id)));
    return players.filter((p): p is Player => p !== undefined);
  },

  /**
   * Create a new player.
   *
   * Automatically generates a unique ID (UUID v4) and sets the `createdAt` timestamp.
   *
   * @param data - The player data, excluding `id` and `createdAt` which are generated automatically.
   * @returns The newly created player, including the generated `id` and `createdAt` fields.
   */
  async create(data: Omit<Player, "id" | "createdAt">): Promise<Player> {
    const db = await getDB();
    const newPlayer: Player = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await db.add("players", newPlayer);
    return newPlayer;
  },

  /**
   * Update an existing player with a partial set of changes.
   *
   * Merges the provided updates into the existing player record. The `id` and
   * `createdAt` fields cannot be changed.
   *
   * @param id - The unique identifier of the player to update.
   * @param updates - A partial object containing the fields to update.
   * @returns The full updated player record.
   * @throws {Error} If no player exists with the given ID.
   */
  async update(id: PlayerId, updates: Partial<Omit<Player, "id" | "createdAt">>): Promise<Player> {
    const db = await getDB();
    const existing = await db.get("players", id);
    if (!existing) throw new Error("Player not found");

    const updated: Player = { ...existing, ...updates };
    await db.put("players", updated);
    return updated;
  },

  /**
   * Delete a player by ID.
   *
   * Removes the player record from the database. No error is thrown if the
   * player does not exist.
   *
   * @param id - The unique identifier of the player to delete.
   */
  async delete(id: PlayerId): Promise<void> {
    const db = await getDB();
    await db.delete("players", id);
  },
};
