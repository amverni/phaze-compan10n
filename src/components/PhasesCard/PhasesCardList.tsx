import type { PhasesCardPhase } from "../../types";
import { formatPhaseDisplayName } from "../../utils";
import { List, numberCircleClasses } from "../ui";

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
      aria-label={scrollable ? "Phases Card phase list" : undefined}
      role={scrollable ? "region" : undefined}
      tabIndex={scrollable ? 0 : undefined}
      scrollable={scrollable}
      className={listClassName}
      isLoading={isLoading}
      shimmerRows={6}
      emptyMessage="No phases in this set"
    >
      {phases.map((phase, index) => {
        const displayName = formatPhaseDisplayName(phase);
        return (
          <div key={`${index}-${displayName}`} className="flex w-full min-w-0 items-center text-sm">
            <span className={["mr-2", numberCircleClasses].join(" ")}>{index + 1}</span>
            <div className="min-w-0 flex-1">
              <span className="block w-full truncate" title={displayName}>
                {displayName}
              </span>
            </div>
          </div>
        );
      })}
    </List>
  );
}
