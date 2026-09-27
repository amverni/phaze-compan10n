import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateGenericGameInput, GameId } from "../../types";
import { genericGamesApi } from "../api/genericGames";
import { playerKeys } from "./usePlayers";

export const genericGameKeys = {
  all: ["games", "generic"] as const,
  lists: () => [...genericGameKeys.all, "list"] as const,
  active: () => [...genericGameKeys.lists(), "active"] as const,
  details: () => [...genericGameKeys.all, "detail"] as const,
  detail: (id: GameId) => [...genericGameKeys.details(), id] as const,
};

export function genericGameDetailOptions(id: GameId) {
  return queryOptions({
    queryKey: genericGameKeys.detail(id),
    queryFn: () => genericGamesApi.getDetail(id),
    enabled: !!id,
  });
}

export function activeGenericGamesOptions() {
  return queryOptions({
    queryKey: genericGameKeys.active(),
    queryFn: () => genericGamesApi.getActiveViews(),
  });
}

export function useCreateGenericGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGenericGameInput) => genericGamesApi.create(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: genericGameKeys.all }),
        queryClient.invalidateQueries({ queryKey: playerKeys.all }),
      ]),
  });
}

export function useDeleteGenericGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: GameId) => genericGamesApi.delete(id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: genericGameKeys.all }),
        queryClient.invalidateQueries({ queryKey: playerKeys.all }),
      ]),
  });
}
