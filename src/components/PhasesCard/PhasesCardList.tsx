import type { PhasesCardPhase, PhasesCardPlayerGroups } from "../../types";
import { formatPhaseDisplayName } from "../../utils";
import { PlayerAvatarStack } from "../PlayerAvatarStack/PlayerAvatarStack";
import { List, numberCircleClasses } from "../ui";

interface PhasesCardListProps {
  phases?: PhasesCardPhase[];
  playerGroups?: PhasesCardPlayerGroups;
  isLoading?: boolean;
  scrollable?: boolean;
  className?: string;
}

export function PhasesCardList({
  phases = [],
  playerGroups,
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
      rowVariant={playerGroups ? "compact-content" : "compact"}
      className={listClassName}
      isLoading={isLoading}
      shimmerRows={6}
      emptyMessage="No phases in this set"
    >
      {phases.map((phase, index) => {
        const displayName = formatPhaseDisplayName(phase);
        const players = playerGroups?.[index + 1];
        const occupied = players && players.length > 0;
        return (
          <div
            key={`${index}-${displayName}`}
            className={[
              "flex w-full min-w-0 text-sm",
              occupied ? "items-start" : "items-center",
            ].join(" ")}
          >
            <span className={["mr-2", numberCircleClasses].join(" ")}>{index + 1}</span>
            <div className="min-w-0 flex-1">
              <span
                className={["block w-full truncate", occupied && "leading-6"]
                  .filter(Boolean)
                  .join(" ")}
                title={displayName}
              >
                {displayName}
              </span>
              {occupied && (
                // biome-ignore lint/a11y/useSemanticElements: This groups identities, not form controls.
                <div role="group" aria-label={`Players on Phase ${index + 1}`} className="mt-2">
                  <div aria-hidden="true">
                    <PlayerAvatarStack players={players} />
                  </div>
                  <ul className="sr-only">
                    {players.map((player) => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </List>
  );
}
