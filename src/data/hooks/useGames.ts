import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ActiveGame, GameId } from "../../types";
import { gamesApi } from "../api/games";

export const gameKeys = {
  all: ["games"] as const,
  lists: () => [...gameKeys.all, "list"] as const,
  active: () => [...gameKeys.lists(), "active"] as const,
  details: () => [...gameKeys.all, "detail"] as const,
  detail: (id: GameId) => [...gameKeys.details(), id] as const,
};

export function gameDetailOptions(id: GameId) {
  return queryOptions({
    queryKey: gameKeys.detail(id),
    queryFn: () => gamesApi.getById(id),
    enabled: !!id,
  });
}

export function activeGamesOptions() {
  return queryOptions({
    queryKey: gameKeys.active(),
    queryFn: () => gamesApi.getActive(),
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ActiveGame, "id" | "createdAt" | "status" | "activePlayers">) =>
      gamesApi.create(data),
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: gameKeys.lists() });
      queryClient.setQueryData(gameKeys.detail(game.id), game);
    },
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: GameId) => gamesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gameKeys.all }),
  });
}
