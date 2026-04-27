import type { Phase } from "../../../types";
import { formatPhaseRequirements } from "../../../utils";

export interface PhaseRowProps {
  phase: Phase;
  index: number;
}

export function PhaseRow({ phase, index }: PhaseRowProps) {
  return (
    <div className="flex w-full min-w-0 items-center text-sm">
      <span className="mr-2 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xs font-semibold text-text-secondary tabular-nums dark:border-white/20 dark:bg-white/10">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <span className="block w-full truncate">{formatPhaseRequirements(phase.requirements)}</span>
      </div>
    </div>
  );
}
