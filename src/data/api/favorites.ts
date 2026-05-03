import { getPhaseSetIdVariants, normalizePhaseSetId } from "../constants/phaseSets";
import { getDB } from "../db";
import type { FavoriteEntityType } from "../db/schema";

function normalizeFavoriteEntityId(entityType: FavoriteEntityType, entityId: string): string {
  return entityType === "phaseSet" ? normalizePhaseSetId(entityId) : entityId;
}

function getFavoriteEntityIdVariants(entityType: FavoriteEntityType, entityId: string): string[] {
  return entityType === "phaseSet" ? getPhaseSetIdVariants(entityId) : [entityId];
}

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
    return [...new Set(favorites.map((f) => normalizeFavoriteEntityId(entityType, f.entityId)))];
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
    const favoriteIds = getFavoriteEntityIdVariants(entityType, entityId);
    const favorites = await Promise.all(
      favoriteIds.map((id) => db.get("favorites", [entityType, id])),
    );
    return favorites.some((favorite) => favorite !== undefined);
  },

  /**
   * Add an entity to favorites.
   *
   * @param entityType - The type of entity.
   * @param entityId - The unique identifier of the entity.
   */
  async add(entityType: FavoriteEntityType, entityId: string): Promise<void> {
    const db = await getDB();
    await db.put("favorites", {
      entityType,
      entityId: normalizeFavoriteEntityId(entityType, entityId),
    });
  },

  /**
   * Remove an entity from favorites.
   *
   * @param entityType - The type of entity.
   * @param entityId - The unique identifier of the entity.
   */
  async remove(entityType: FavoriteEntityType, entityId: string): Promise<void> {
    const db = await getDB();
    await Promise.all(
      getFavoriteEntityIdVariants(entityType, entityId).map((id) =>
        db.delete("favorites", [entityType, id]),
      ),
    );
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
