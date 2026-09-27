import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateGameInput, GameId } from "../../types";
import { gamesApi } from "../api/games";
import { roundKeys } from "./useRounds";

export const gameKeys = {
  all: ["games"] as const,
  lists: () => [...gameKeys.all, "phase10", "list"] as const,
  active: () => [...gameKeys.lists(), "active"] as const,
  details: () => [...gameKeys.all, "phase10", "detail"] as const,
  detail: (id: GameId) => [...gameKeys.details(), id] as const,
};

export function gameDetailOptions(id: GameId) {
  return queryOptions({
    queryKey: gameKeys.detail(id),
    queryFn: async () => (await gamesApi.getById(id)) ?? null,
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
    mutationFn: (data: CreateGameInput) => gamesApi.create(data),
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

export function useFinishGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: GameId) => gamesApi.finish(id),
    onSuccess: async (game) => {
      queryClient.setQueryData(gameKeys.detail(game.id), game);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: gameKeys.all }),
        queryClient.invalidateQueries({ queryKey: roundKeys.all }),
      ]);
    },
  });
}
