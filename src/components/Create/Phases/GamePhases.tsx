import { ArrowRightLeft, Dices, Shuffle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

const PHASE_TRANSITION_MS = 2000;

interface AnimatedPhaseRow {
  phase: Phase;
  displayIndex: number;
  animation: "enter" | "exit" | null;
}

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
  const [animatedRows, setAnimatedRows] = useState<Record<string, AnimatedPhaseRow>>({});
  const [animatedOrder, setAnimatedOrder] = useState<string[] | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const [animateReorderChanges, setAnimateReorderChanges] = useState(true);

  useEffect(
    () => () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    },
    [],
  );

  function clearActiveTransition() {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setAnimatedRows({});
    setAnimatedOrder(null);
  }

  function handleReorder(items: SortableItem[]) {
    clearActiveTransition();
    setAnimateReorderChanges(true);
    const reordered = items
      .map((item) => phases.find((p) => p.id === item.id))
      .filter((p) => p !== undefined);
    reorderPhases(reordered);
  }

  function handleShuffle() {
    if (phases.length < 2) return;
    clearActiveTransition();
    setAnimateReorderChanges(true);
    reorderPhases(shuffle(phases));
  }

  function handleReplacePhases(nextPhases: Phase[]) {
    if (nextPhases.length === 0) return;
    const currentPhases = phases;
    const sameOrder =
      currentPhases.length === nextPhases.length &&
      currentPhases.every((phase, index) => phase.id === nextPhases[index]?.id);

    if (sameOrder || currentPhases.length === 0) {
      clearActiveTransition();
      setAnimateReorderChanges(true);
      setPhases(nextPhases);
      return;
    }

    const currentIds = new Set(currentPhases.map((phase) => phase.id));
    const nextIds = new Set(nextPhases.map((phase) => phase.id));
    const enteringIds = new Set(nextPhases.filter((phase) => !currentIds.has(phase.id)).map((p) => p.id));
    const exitingPhases = currentPhases.filter((phase) => !nextIds.has(phase.id));
    const hasEnteringOrExiting = enteringIds.size > 0 || exitingPhases.length > 0;

    setAnimateReorderChanges(true);
    setPhases(nextPhases);

    if (!hasEnteringOrExiting) {
      clearActiveTransition();
      return;
    }

    clearActiveTransition();

    const nextRows: AnimatedPhaseRow[] = nextPhases.map((phase, index) => ({
      phase,
      displayIndex: index,
      animation: enteringIds.has(phase.id) ? "enter" : null,
    }));
    const nextRowsById = new Map(nextRows.map((row) => [row.phase.id, row]));
    const mergedOrder = [...nextPhases.map((phase) => phase.id)];

    for (const exitingPhase of exitingPhases) {
      const oldIndex = currentPhases.findIndex((phase) => phase.id === exitingPhase.id);
      const insertAt = Math.min(oldIndex, mergedOrder.length);
      mergedOrder.splice(insertAt, 0, exitingPhase.id);
      nextRowsById.set(exitingPhase.id, {
        phase: exitingPhase,
        displayIndex: oldIndex,
        animation: "exit",
      });
    }

    setAnimatedRows(Object.fromEntries(nextRowsById));
    setAnimatedOrder(mergedOrder);

    transitionTimerRef.current = window.setTimeout(() => {
      // Prevent a second FLIP pass when the temporary exiting rows are removed.
      setAnimateReorderChanges(false);
      setAnimatedRows({});
      setAnimatedOrder(null);
      window.requestAnimationFrame(() => {
        setAnimateReorderChanges(true);
      });
      transitionTimerRef.current = null;
    }, PHASE_TRANSITION_MS);
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

  const displayedRows =
    animatedOrder === null
      ? phases.map((phase, index) => ({
          phase,
          displayIndex: index,
          animation: null,
        }))
      : animatedOrder
          .map((phaseId) => animatedRows[phaseId])
          .filter((row): row is AnimatedPhaseRow => row !== undefined);
  const items = displayedRows.map((row) => ({ id: row.phase.id }));
  const itemAnimationStateById = displayedRows.reduce<Record<string, "enter" | "exit">>(
    (acc, row) => {
      if (row.animation !== null) {
        acc[row.phase.id] = row.animation;
      }
      return acc;
    },
    {},
  );

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
        items={items}
        onReorder={handleReorder}
        onRemove={removePhase}
        animateNewItems
        animateReorderChanges={animateReorderChanges}
        transitionDurationMs={PHASE_TRANSITION_MS}
        animateContainerHeight={false}
        itemAnimationStateById={itemAnimationStateById}
      >
        {displayedRows.map((row) => (
          <PhaseRow
            key={row.phase.id}
            phase={row.phase}
            index={row.displayIndex}
          />
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
