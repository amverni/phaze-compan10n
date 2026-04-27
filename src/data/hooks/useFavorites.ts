import { useMutation, useQueryClient } from "@tanstack/react-query";
import { favoritesApi } from "../api/favorites";
import type { FavoriteEntityType } from "../db/schema";
import { phaseSetKeys } from "./usePhaseSets";
import { phaseKeys } from "./usePhases";

export const favoriteKeys = {
  all: ["favorites"] as const,
  byType: (entityType: FavoriteEntityType) => [...favoriteKeys.all, entityType] as const,
};

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityType, entityId }: { entityType: FavoriteEntityType; entityId: string }) =>
      favoritesApi.toggle(entityType, entityId),
    onSuccess: (_result, { entityType }) => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.all });
      // Invalidate the entity list queries since isFavorite filters may be active
      if (entityType === "phase") {
        queryClient.invalidateQueries({ queryKey: phaseKeys.all });
      } else {
        queryClient.invalidateQueries({ queryKey: phaseSetKeys.all });
      }
    },
  });
}
