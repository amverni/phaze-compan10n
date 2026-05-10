import { queryOptions } from "@tanstack/react-query";
import type { BuiltInT, MeldType, PhaseId, PhaseSetId, SavedT } from "../../types";
import { phasesApi } from "../api/phases";

export const phaseKeys = {
  all: ["phases"] as const,
  lists: () => [...phaseKeys.all, "list"] as const,
  list: (filters: {
    type?: BuiltInT | SavedT;
    search?: string;
    isFavorite?: 0 | 1;
    meldTypes?: MeldType[];
    phaseSetId?: PhaseSetId;
  }) => [...phaseKeys.lists(), filters] as const,
  details: () => [...phaseKeys.all, "detail"] as const,
  detail: (id: PhaseId) => [...phaseKeys.details(), id] as const,
  byIds: (ids: PhaseId[]) => [...phaseKeys.all, "byIds", ids] as const,
};

export function phaseListOptions(filters?: {
  type?: BuiltInT | SavedT;
  search?: string;
  isFavorite?: 0 | 1;
  meldTypes?: MeldType[];
  phaseSetId?: PhaseSetId;
}) {
  return queryOptions({
    queryKey: phaseKeys.list(filters ?? {}),
    queryFn: () => phasesApi.getAll(filters),
  });
}

export function phasesByIdsOptions(ids: PhaseId[]) {
  return queryOptions({
    queryKey: phaseKeys.byIds(ids),
    queryFn: () => phasesApi.getByIds(ids),
    enabled: ids.length > 0,
  });
}
