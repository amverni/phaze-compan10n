import { queryOptions } from "@tanstack/react-query";
import type { BuiltInT, PhaseSet, PhaseSetId, SavedT } from "../../types";
import { phaseSetsApi } from "../api/phaseSets";

export type PhaseSetDetail = PhaseSet | null;

export const phaseSetKeys = {
  all: ["phaseSets"] as const,
  lists: () => [...phaseSetKeys.all, "list"] as const,
  list: (filters: { type?: BuiltInT | SavedT; name?: string; isFavorite?: 0 | 1 }) =>
    [...phaseSetKeys.lists(), filters] as const,
  details: () => [...phaseSetKeys.all, "detail"] as const,
  detail: (id: PhaseSetId) => [...phaseSetKeys.details(), id] as const,
  phases: (id: PhaseSetId) => [...phaseSetKeys.detail(id), "phases"] as const,
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
    queryFn: async (): Promise<PhaseSetDetail> => (await phaseSetsApi.getById(id)) ?? null,
    enabled: !!id,
  });
}

export function phaseSetPhasesOptions(id: PhaseSetId) {
  return queryOptions({
    queryKey: phaseSetKeys.phases(id),
    queryFn: () => phaseSetsApi.getPhases(id),
    enabled: !!id,
  });
}
