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
import {
  phaseSetDetailOptions,
  phaseSetListOptions,
  phaseSetPhasesStatusOptions,
} from "../../data/hooks/usePhaseSets";
import { appSettingsOptions } from "../../data/hooks/useSettings";
import type { PhaseSetId } from "../../types";
import "../../components/PhasesCard/PhasesCardSelector.css";

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
    data: phaseStatus,
    isError: phasesError,
    isLoading: phasesLoading,
    refetch: refetchPhases,
  } = useQuery({
    ...phaseSetPhasesStatusOptions(selectedId),
    enabled: !!selectedPhaseSet,
  });
  const phases = phaseStatus?.phases ?? [];

  const loading = settingsLoading || phaseSetsLoading || phaseSetLoading || phasesLoading;
  const selectedMissing = selectedId.length > 0 && !loading && selectedPhaseSet === null;
  const missingPhaseRecords =
    !phasesLoading && !phasesError && (phaseStatus?.missingPhaseRecords ?? false);
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
            : missingPhaseRecords
              ? "This Phase Set is missing phase data and cannot be shared."
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
        : selectedMissing
          ? "Phase Set not found"
          : "Choose Phase Set");

  return (
    <PhasesCardPage
      topContent={
        <Listbox
          value={selectedId}
          onChange={setSelectedId}
          disabled={settingsLoading || phaseSetsLoading || settingsError || phaseSetsError}
          className="flex w-full justify-center"
        >
          <ListboxLabel className="sr-only">Phase Set</ListboxLabel>
          <ListboxButton
            variant="plain"
            className={[
              "glass w-fit min-w-[50%] max-w-full justify-between!",
              "rounded-full! px-3! py-2!",
            ].join(" ")}
          >
            <span className="block min-w-0 flex-1 truncate text-left">{selectedLabel}</span>
          </ListboxButton>
          <ListboxOptions
            anchor={{ to: "bottom", gap: "0.25rem", padding: "1rem" }}
            transformOrigin="top"
            className="phases-card-selector-options [--anchor-max-height:min(20rem,calc(100svh-2rem))] max-w-[calc(100vw-2rem)] overflow-y-auto"
          >
            {phaseSets.map(({ id, name }) => (
              <ListboxOption key={id} value={id} className="max-w-full">
                <span className="block min-w-0 flex-1 truncate">{name}</span>
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
        selectedPhaseSet && !missingPhaseRecords
          ? { source: "phase-set", name: selectedPhaseSet.name, phases, phaseSet: selectedPhaseSet }
          : undefined
      }
    />
  );
}
