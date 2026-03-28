import { queryOptions } from "@tanstack/react-query";
import type { BuiltInT, SavedT } from "../../types";
import { phaseSetsApi } from "../api/phaseSets";

export const phaseSetKeys = {
  all: ["phaseSets"] as const,
  lists: () => [...phaseSetKeys.all, "list"] as const,
  list: (filters: { type?: BuiltInT | SavedT; name?: string }) =>
    [...phaseSetKeys.lists(), filters] as const,
};

export function phaseSetListOptions(filters?: { type?: BuiltInT | SavedT; name?: string }) {
  return queryOptions({
    queryKey: phaseSetKeys.list(filters ?? {}),
    queryFn: () => phaseSetsApi.getAll(filters),
  });
}
