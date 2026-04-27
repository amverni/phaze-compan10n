import { queryOptions } from "@tanstack/react-query";
import type { BuiltInT, PhaseSetId, SavedT } from "../../types";
import { phaseSetsApi } from "../api/phaseSets";

export const phaseSetKeys = {
  all: ["phaseSets"] as const,
  lists: () => [...phaseSetKeys.all, "list"] as const,
  list: (filters: { type?: BuiltInT | SavedT; name?: string; isFavorite?: 0 | 1 }) =>
    [...phaseSetKeys.lists(), filters] as const,
  details: () => [...phaseSetKeys.all, "detail"] as const,
  detail: (id: PhaseSetId) => [...phaseSetKeys.details(), id] as const,
};

export function phaseSetListOptions(filters?: {
  type?: BuiltInT | SavedT;
  name?: string;
  isFavorite?: 0 | 1;
}) {
  return queryOptions({
    queryKey: phaseSetKeys.list(filters ?? {}),
    queryFn: () => phaseSetsApi.getAll(filters),
  });
}

export function phaseSetDetailOptions(id: PhaseSetId) {
  return queryOptions({
    queryKey: phaseSetKeys.detail(id),
    queryFn: () => phaseSetsApi.getById(id),
    enabled: !!id,
  });
}
