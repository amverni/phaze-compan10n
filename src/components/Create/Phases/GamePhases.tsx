import { useEffect, useState } from "react";
import { phaseSetsApi } from "../../../data/api/phaseSets";
import { phasesApi } from "../../../data/api/phases";
import type { Phase } from "../../../types";
import { formatPhaseDisplayName, shuffle } from "../../../utils";
import type { SortableItem } from "../../ui";
import { List } from "../../ui";
import {
  useDefaultPhaseSetId,
  useGamePhases,
  useRemovePhase,
  useReorderPhases,
  useSetPhases,
} from "../CreateGameContext";
import { AddPhaseButton } from "./AddPhaseButton";
import { PhaseButtonRow } from "./PhaseButtonRow";
import { PhaseRow } from "./PhaseRow";

export interface GamePhasesProps {
  externalReplacementPhases?: Phase[] | null;
  onExternalReplacementHandled?: () => void;
}

export function GamePhases({
  externalReplacementPhases = null,
  onExternalReplacementHandled,
}: GamePhasesProps) {
  const phases = useGamePhases();
  const defaultPhaseSetId = useDefaultPhaseSetId();
  const removePhase = useRemovePhase();
  const reorderPhases = useReorderPhases();
  const setPhases = useSetPhases();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleReorder(items: SortableItem[]) {
    const phasesById = new Map(phases.map((phase) => [phase.id, phase]));
    const reordered = items.map((item) => phasesById.get(item.id)).filter((p) => p !== undefined);
    reorderPhases(reordered);
  }

  function handleShuffle() {
    if (phases.length < 2) return;
    reorderPhases(shuffle(phases));
  }

  function handleReplacePhases(nextPhases: Phase[]) {
    if (nextPhases.length === 0) return;
    setPhases(nextPhases);
  }

  async function handleDefaultPhaseSet() {
    try {
      setActionError(null);
      const defaultPhases = await phaseSetsApi.getPhases(defaultPhaseSetId);
      handleReplacePhases(defaultPhases);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Unable to load the default phase set",
      );
    }
  }

  async function handleRandom(count: number) {
    try {
      setActionError(null);
      const picked = await phasesApi.getRandom(count);
      if (picked.length > 0) handleReplacePhases(picked);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to choose random phases");
    }
  }

  useEffect(() => {
    if (!externalReplacementPhases || externalReplacementPhases.length === 0) return;
    setPhases(externalReplacementPhases);
    onExternalReplacementHandled?.();
  }, [externalReplacementPhases, onExternalReplacementHandled, setPhases]);

  return (
    <section>
      <PhaseButtonRow
        phaseCount={phases.length}
        onReset={handleDefaultPhaseSet}
        onShuffle={handleShuffle}
        onRandom={handleRandom}
        onSelectPhaseSet={handleReplacePhases}
      />
      {actionError && (
        <p
          className="mb-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {actionError}
        </p>
      )}
      <List
        sortable
        removable
        items={phases.map((phase) => ({ id: phase.id, label: formatPhaseDisplayName(phase) }))}
        onReorder={handleReorder}
        onRemove={removePhase}
      >
        {phases.map((phase, index) => (
          <PhaseRow key={phase.id} phase={phase} index={index} />
        ))}
        <AddPhaseButton key="add-phase" />
      </List>
    </section>
  );
}
