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
    <section
      aria-label="Phases Card phase list"
      className={[
        "min-h-0 overflow-y-auto rounded-2xl focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      /* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable phase lists need keyboard focus for arrow/page scrolling. */
      tabIndex={0}
    >
      <List
        className="min-h-full"
        isLoading={isLoading}
        shimmerRows={6}
        emptyMessage="No phases in this set"
      >
        {phases.map((phase, index) => (
          <div
            key={`${index}-${formatPhaseDisplayName(phase)}`}
            className="flex items-center gap-2"
          >
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xs font-semibold text-text-secondary tabular-nums dark:border-white/20 dark:bg-white/10">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate">{formatPhaseDisplayName(phase)}</span>
          </div>
        ))}
      </List>
    </section>
  );
}
