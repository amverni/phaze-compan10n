import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhasesCardPage } from "../../components/PhasesCard";
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from "../../components/ui";
import { phaseSetDetailOptions, phaseSetListOptions } from "../../data/hooks/usePhaseSets";
import { phasesByIdsOptions } from "../../data/hooks/usePhases";
import { appSettingsOptions } from "../../data/hooks/useSettings";
import type { PhaseSetId } from "../../types";

export const Route = createFileRoute("/phasescard/")({
  component: PhasesCardIndexRoute,
});

function PhasesCardIndexRoute() {
  const {
    data: settings,
    isError: settingsError,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery(appSettingsOptions());
  const {
    data: phaseSets = [],
    isError: phaseSetsError,
    isLoading: phaseSetsLoading,
    refetch: refetchPhaseSets,
  } = useQuery(phaseSetListOptions());
  const [selectedId, setSelectedId] = useState<PhaseSetId>("");

  useEffect(() => {
    if (!settings || selectedId) return;
    setSelectedId(settings.gameDefaults.phaseSetId);
  }, [settings, selectedId]);

  const {
    data: selectedPhaseSet,
    isError: phaseSetError,
    isLoading: phaseSetLoading,
    refetch: refetchPhaseSet,
  } = useQuery({
    ...phaseSetDetailOptions(selectedId),
    enabled: selectedId.length > 0,
  });
  const {
    data: phases = [],
    isError: phasesError,
    isLoading: phasesLoading,
    refetch: refetchPhases,
  } = useQuery({
    ...phasesByIdsOptions(selectedPhaseSet?.phases ?? []),
    enabled: !!selectedPhaseSet,
  });

  const loading = settingsLoading || phaseSetsLoading || phaseSetLoading || phasesLoading;
  const selectedMissing = selectedId.length > 0 && !loading && !selectedPhaseSet;
  const errorMessage = settingsError
    ? "Unable to load Phases Card settings."
    : phaseSetsError
      ? "Unable to load Phase Sets."
      : phaseSetError
        ? "Unable to load the selected Phase Set."
        : phasesError
          ? "Unable to load phases for the selected Phase Set."
          : selectedMissing
            ? "Selected Phase Set not found."
            : undefined;

  function retryFailedQueries() {
    if (settingsError) void refetchSettings();
    if (phaseSetsError) void refetchPhaseSets();
    if (phaseSetError) void refetchPhaseSet();
    if (phasesError) void refetchPhases();
  }

  const selectedLabel =
    selectedPhaseSet?.name ??
    (settingsError || phaseSetsError || phaseSetError
      ? "Unable to load"
      : settingsLoading || phaseSetsLoading || phaseSetLoading
        ? "Loading..."
        : "Choose Phase Set");

  return (
    <PhasesCardPage
      topContent={
        <Listbox
          value={selectedId}
          onChange={setSelectedId}
          disabled={settingsLoading || phaseSetsLoading || settingsError || phaseSetsError}
        >
          <ListboxLabel className="sr-only">Phase Set</ListboxLabel>
          <ListboxButton>{selectedLabel}</ListboxButton>
          <ListboxOptions
            anchor={{ to: "bottom", gap: "0.25rem", padding: "1rem" }}
            transformOrigin="top"
          >
            {phaseSets.map(({ id, name }) => (
              <ListboxOption key={id} value={id}>
                {name}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      }
      phases={phases}
      isLoading={loading}
      errorMessage={errorMessage}
      onErrorRetry={
        settingsError || phaseSetsError || phaseSetError || phasesError
          ? retryFailedQueries
          : undefined
      }
      shareTarget={
        selectedPhaseSet
          ? { name: selectedPhaseSet.name, phases, phaseSet: selectedPhaseSet }
          : undefined
      }
    />
  );
}
