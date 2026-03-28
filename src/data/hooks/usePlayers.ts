import { queryOptions } from "@tanstack/react-query";
import type { PlayerId } from "../../types";
import { playersApi } from "../api/players";

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
