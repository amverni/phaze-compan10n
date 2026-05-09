import { useEffect } from "react";
import { phaseSetsApi } from "../../../data/api/phaseSets";
import { phasesApi } from "../../../data/api/phases";
import type { Phase } from "../../../types";
import { shuffle } from "../../../utils";
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

  function handleReorder(items: SortableItem[]) {
    const reordered = items
      .map((item) => phases.find((p) => p.id === item.id))
      .filter((p) => p !== undefined);
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
    const defaultPhases = await phaseSetsApi.getPhases(defaultPhaseSetId);
    handleReplacePhases(defaultPhases);
  }

  async function handleRandom(count: number) {
    try {
      const picked = await phasesApi.getRandom(count);
      if (picked.length > 0) handleReplacePhases(picked);
    } catch {
      // Silently fail
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
      <List
        sortable
        removable
        items={phases.map((phase) => ({ id: phase.id }))}
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
