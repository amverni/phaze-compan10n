import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedPhaseSet } from "../../types";
import type { ImportedPhasesCardInput } from "../api/phasesCardImport";
import { phasesCardImportApi } from "../api/phasesCardImport";
import { phaseSetKeys } from "./usePhaseSets";
import { phaseKeys } from "./usePhases";
import { settingsKeys } from "./useSettings";

export type ImportedPhasesCardMatch = SavedPhaseSet | null;

export const phasesCardImportKeys = {
  all: ["phasesCardImport"] as const,
  match: (input: ImportedPhasesCardInput) => [...phasesCardImportKeys.all, "match", input] as const,
};

export function importedPhasesCardMatchOptions(input: ImportedPhasesCardInput) {
  return queryOptions({
    queryKey: phasesCardImportKeys.match(input),
    queryFn: async (): Promise<ImportedPhasesCardMatch> =>
      (await phasesCardImportApi.findSavedMatch(input)) ?? null,
    enabled: input.name.trim().length > 0 && input.phases.length > 0,
  });
}

export function useSaveImportedPhasesCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportedPhasesCardInput) => phasesCardImportApi.saveImported(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: phasesCardImportKeys.all });
      queryClient.invalidateQueries({ queryKey: phaseSetKeys.all });
      queryClient.invalidateQueries({ queryKey: phaseKeys.all });
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
}
