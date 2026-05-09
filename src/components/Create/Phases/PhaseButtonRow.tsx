import { useState } from "react";
import type { Phase } from "../../../types";
import { PhaseSetButton } from "./PhaseSetButton";
import { RandomPhasesButton } from "./RandomPhasesButton";
import { ResetPhaseSetButton } from "./ResetPhaseSetButton";
import { SavePhaseSetButton } from "./SavePhaseSetButton";
import { ShufflePhasesButton } from "./ShufflePhasesButton";
import { SwitchPhaseSetDialog } from "./SwitchPhaseSetDialog";

export interface PhaseButtonRowProps {
  phaseCount: number;
  onReset: () => void;
  onShuffle: () => void;
  onRandom: (count: number) => void;
  onSelectPhaseSet: (phases: Phase[]) => void;
}

export function PhaseButtonRow({
  phaseCount,
  onReset,
  onShuffle,
  onRandom,
  onSelectPhaseSet,
}: PhaseButtonRowProps) {
  const [switchOpen, setSwitchOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <div className="flex shrink-0 items-center">
          <PhaseSetButton onClick={() => setSwitchOpen(true)} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ResetPhaseSetButton onClick={onReset} />
          <ShufflePhasesButton onClick={onShuffle} disabled={phaseCount < 2} />
          <RandomPhasesButton onRandom={onRandom} />
          <SavePhaseSetButton disabled={phaseCount === 0} />
        </div>
      </div>
      <SwitchPhaseSetDialog
        open={switchOpen}
        onClose={() => setSwitchOpen(false)}
        onSelectPhases={onSelectPhaseSet}
      />
    </>
  );
}
