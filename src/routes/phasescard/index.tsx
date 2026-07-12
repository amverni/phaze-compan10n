import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhasesCardPage } from "../../components/PhasesCard";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "../../components/ui";
import { phaseSetDetailOptions, phaseSetListOptions } from "../../data/hooks/usePhaseSets";
import { phasesByIdsOptions } from "../../data/hooks/usePhases";
import { appSettingsOptions } from "../../data/hooks/useSettings";
import type { PhaseSetId } from "../../types";

export const Route = createFileRoute("/phasescard/")({
  component: PhasesCardIndexRoute,
});

function PhasesCardIndexRoute() {
  const { data: settings, isLoading: settingsLoading } = useQuery(appSettingsOptions());
  const { data: phaseSets = [], isLoading: phaseSetsLoading } = useQuery(phaseSetListOptions());
  const [selectedId, setSelectedId] = useState<PhaseSetId>("");

  useEffect(() => {
    if (!settings || selectedId) return;
    setSelectedId(settings.gameDefaults.phaseSetId);
  }, [settings, selectedId]);

  const { data: selectedPhaseSet, isLoading: phaseSetLoading } = useQuery({
    ...phaseSetDetailOptions(selectedId),
    enabled: selectedId.length > 0,
  });
  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    ...phasesByIdsOptions(selectedPhaseSet?.phases ?? []),
    enabled: !!selectedPhaseSet,
  });

  const selectedLabel =
    selectedPhaseSet?.name ??
    (settingsLoading || phaseSetsLoading || phaseSetLoading ? "Loading..." : "Choose Phase Set");

  return (
    <PhasesCardPage
      topContent={
        <Listbox
          value={selectedId}
          onChange={setSelectedId}
          disabled={settingsLoading || phaseSetsLoading}
          aria-label="Phase Set"
        >
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
      isLoading={settingsLoading || phaseSetsLoading || phaseSetLoading || phasesLoading}
      shareTarget={
        selectedPhaseSet
          ? { name: selectedPhaseSet.name, phases, phaseSet: selectedPhaseSet }
          : undefined
      }
    />
  );
}
