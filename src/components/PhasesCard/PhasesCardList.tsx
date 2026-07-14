import type { PhasesCardPhase } from "../../types";
import { formatPhaseDisplayName } from "../../utils";
import { List } from "../ui";

interface PhasesCardListProps {
  phases?: PhasesCardPhase[];
  isLoading?: boolean;
  scrollable?: boolean;
  className?: string;
}

export function PhasesCardList({
  phases = [],
  isLoading = false,
  scrollable = true,
  className,
}: PhasesCardListProps) {
  const listClassName = [
    "rounded-2xl",
    scrollable &&
      "min-h-0 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <List
      aria-label="Phases Card phase list"
      role="region"
      tabIndex={scrollable ? 0 : undefined}
      scrollable={scrollable}
      className={listClassName}
      isLoading={isLoading}
      shimmerRows={6}
      emptyMessage="No phases in this set"
      rowVariant="content"
    >
      {phases.map((phase, index) => (
        <div
          key={`${index}-${formatPhaseDisplayName(phase)}`}
          className="flex w-full min-w-0 items-start gap-3"
        >
          <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xs font-semibold text-text-secondary tabular-nums dark:border-white/20 dark:bg-white/10">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 break-words">{formatPhaseDisplayName(phase)}</span>
        </div>
      ))}
    </List>
  );
}
