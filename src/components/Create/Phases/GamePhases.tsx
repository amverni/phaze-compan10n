import { ArrowRightLeft, Dices, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { phasesApi } from "../../../data/api/phases";
import type { Phase } from "../../../types";
import { shuffle } from "../../../utils";
import type { SortableItem } from "../../ui";
import { Button, List } from "../../ui";
import {
  useGamePhases,
  useRemovePhase,
  useReorderPhases,
  useSetPhases,
} from "../CreateGameContext";
import { AddPhaseButton } from "./AddPhaseButton";
import { PhaseRow } from "./PhaseRow";
import { SwitchPhaseSetDialog } from "./SwitchPhaseSetDialog";

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
  const [switchOpen, setSwitchOpen] = useState(false);

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

  async function handleRandom10() {
    try {
      const picked = await phasesApi.getRandom(10);
      if (picked.length > 0) handleReplacePhases(picked);
    } catch {
      // Silently fail
    }
  }

  useEffect(() => {
    if (!externalReplacementPhases || externalReplacementPhases.length === 0) return;
    handleReplacePhases(externalReplacementPhases);
    onExternalReplacementHandled?.();
  }, [externalReplacementPhases, onExternalReplacementHandled]);

  const actionClasses = "gap-1.5 px-3 py-1.5 text-xs font-medium";

  return (
    <section>
      <div className="flex items-center gap-2 pb-2">
        <Button
          className={actionClasses}
          onClick={() => setSwitchOpen(true)}
          aria-label="Switch phase set"
        >
          <ArrowRightLeft className="size-3.5" />
          <span>Phase Set</span>
        </Button>
        <Button
          className={actionClasses}
          onClick={handleShuffle}
          disabled={phases.length < 2}
          aria-label="Shuffle phase order"
        >
          <Shuffle className="size-3.5" />
          <span>Shuffle</span>
        </Button>
        <Button
          className={actionClasses}
          onClick={handleRandom10}
          aria-label="Pick 10 random phases"
        >
          <Dices className="size-3.5" />
          <span>Random 10</span>
        </Button>
      </div>
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
        <AddPhaseButton />
      </List>
      <SwitchPhaseSetDialog
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        onSelectPhases={handleReplacePhases}
      />
    </section>
  );
}
