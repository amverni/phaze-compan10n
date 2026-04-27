import { Button } from "@headlessui/react";
import { Plus } from "lucide-react";
import type { Phase, VisiblePhase } from "../../../types";
import { formatPhaseRequirements } from "../../../utils";

export interface AddPhaseRowProps {
  phase: VisiblePhase;
  onSelect: (phase: Phase) => void;
  disabled?: boolean;
}

export function AddPhaseRow({ phase, onSelect, disabled }: AddPhaseRowProps) {
  return (
    <Button
      className="relative -mx-3 flex h-full w-[calc(100%+1.5rem)] cursor-pointer items-center justify-between px-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
      onClick={() => onSelect(phase)}
      disabled={disabled}
    >
      <span className="truncate">{formatPhaseRequirements(phase.requirements)}</span>
      <Plus className="h-5 w-5 shrink-0 text-text-secondary" />
    </Button>
  );
}
