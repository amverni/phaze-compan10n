import { getDB } from "../db";
import type { FavoriteEntityType } from "../db/schema";

export const favoritesApi = {
  /**
   * Get all favorite entity IDs for a given entity type.
   *
   * @param entityType - The type of entity to get favorites for.
   * @returns An array of entity IDs that are favorited.
   */
  async getAll(entityType: FavoriteEntityType): Promise<string[]> {
    const db = await getDB();
    const favorites = await db.getAllFromIndex("favorites", "by-type", entityType);
    return favorites.map((f) => f.entityId);
  },

  /**
   * Check whether a specific entity is favorited.
   *
   * @param entityType - The type of entity.
   * @param entityId - The unique identifier of the entity.
   * @returns `true` if the entity is favorited.
   */
  async isFavorite(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
    const db = await getDB();
    const favorite = await db.get("favorites", [entityType, entityId]);
    return favorite !== undefined;
  },

  /**
   * Add an entity to favorites.
   *
   * @param entityType - The type of entity.
   * @param entityId - The unique identifier of the entity.
   */
  async add(entityType: FavoriteEntityType, entityId: string): Promise<void> {
    const db = await getDB();
    await db.put("favorites", { entityType, entityId });
  },

  /**
   * Remove an entity from favorites.
   *
   * @param entityType - The type of entity.
   * @param entityId - The unique identifier of the entity.
   */
  async remove(entityType: FavoriteEntityType, entityId: string): Promise<void> {
    const db = await getDB();
    await db.delete("favorites", [entityType, entityId]);
  },

  /**
   * Toggle an entity's favorite status.
   *
   * @param entityType - The type of entity.
   * @param entityId - The unique identifier of the entity.
   * @returns `true` if the entity is now favorited, `false` if unfavorited.
   */
  async toggle(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
    const isFav = await this.isFavorite(entityType, entityId);
    if (isFav) {
      await this.remove(entityType, entityId);
    } else {
      await this.add(entityType, entityId);
    }
    return !isFav;
  },
};
