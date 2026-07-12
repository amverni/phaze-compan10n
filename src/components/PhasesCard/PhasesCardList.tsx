import type { PhasesCardPhase } from "../../types";
import { formatPhaseDisplayName } from "../../utils";
import { List } from "../ui";

interface PhasesCardListProps {
  phases?: PhasesCardPhase[];
  isLoading?: boolean;
  className?: string;
}

export function PhasesCardList({ phases = [], isLoading = false, className }: PhasesCardListProps) {
  return (
    <List
      scrollable
      className={["min-h-0", className].filter(Boolean).join(" ")}
      isLoading={isLoading}
      shimmerRows={6}
      emptyMessage="No phases in this set"
    >
      {phases.map((phase, index) => (
        <div key={`${index}-${formatPhaseDisplayName(phase)}`} className="flex items-center gap-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xs font-semibold text-text-secondary tabular-nums dark:border-white/20 dark:bg-white/10">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate">{formatPhaseDisplayName(phase)}</span>
        </div>
      ))}
    </List>
  );
}
