import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Game, Player, PlayerId } from "../../types";
import { getGamePlayers } from "../api/gameResults";
import { playersApi } from "../api/players";
import { gameKeys } from "./useGames";

export const playerKeys = {
  all: ["players"] as const,
  lists: () => [...playerKeys.all, "list"] as const,
  list: (filters: { isFavorite?: 0 | 1; name?: string }) =>
    [...playerKeys.lists(), filters] as const,
  details: () => [...playerKeys.all, "detail"] as const,
  detail: (id: PlayerId) => [...playerKeys.details(), id] as const,
  byIds: (ids: PlayerId[]) => [...playerKeys.all, "byIds", ids] as const,
};

export function playerListOptions(filters?: { isFavorite?: 0 | 1; name?: string }) {
  return queryOptions({
    queryKey: playerKeys.list(filters ?? {}),
    queryFn: () => playersApi.getAll(filters),
  });
}

export function playersByIdsOptions(ids: PlayerId[]) {
  return queryOptions({
    queryKey: playerKeys.byIds(ids),
    queryFn: () => playersApi.getByIds(ids),
    enabled: ids.length > 0,
  });
}

export function useGamePlayers(game: Game | null | undefined) {
  const query = useQuery({
    ...playersByIdsOptions(game?.players ?? []),
    enabled: game?.status === "active",
  });
  return {
    ...query,
    isError: game?.status === "active" && query.isError,
    data:
      !game || (game.status === "active" && !query.data)
        ? undefined
        : getGamePlayers(game, query.data ?? []),
  };
}

export function useCreatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Player, "id" | "createdAt">) => playersApi.create(data),
    onSuccess: () => invalidatePlayerViews(queryClient),
  });
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: PlayerId;
      updates: Partial<Omit<Player, "id" | "createdAt">>;
    }) => playersApi.update(id, updates),
    onSuccess: () => invalidatePlayerViews(queryClient),
  });
}

export function useDeletePlayer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: PlayerId) => playersApi.delete(id),
    onSuccess: () => invalidatePlayerViews(queryClient),
  });
}

function invalidatePlayerViews(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: playerKeys.all }),
    queryClient.invalidateQueries({ queryKey: gameKeys.all }),
  ]);
}
