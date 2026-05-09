import { useEffect } from "react";
import { phaseSetsApi } from "../../../data/api/phaseSets";
import { phasesApi } from "../../../data/api/phases";
import { originalPhaseSet } from "../../../data/constants/phaseSets";
import type { Phase } from "../../../types";
import { shuffle } from "../../../utils";
import type { SortableItem } from "../../ui";
import { List } from "../../ui";
import {
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

  async function handleOriginal10() {
    const originalPhases = await phaseSetsApi.getPhases(originalPhaseSet.id);
    handleReplacePhases(originalPhases);
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
        onReset={handleOriginal10}
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
