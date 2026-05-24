import { Check } from "lucide-react";
import type { Player } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { Popover, PopoverButton, PopoverPanel } from "../ui/Popover/Popover";

interface AddRoundProgressPopoverProps {
  players: Player[];
  /** Player IDs whose round result has been entered. */
  completedPlayerIds: Set<string>;
  /** True if a Round Winner is currently selected. */
  hasRoundWinner: boolean;
}

export function AddRoundProgressPopover({
  players,
  completedPlayerIds,
  hasRoundWinner,
}: AddRoundProgressPopoverProps) {
  const total = players.length;
  const completed = players.filter((p) => completedPlayerIds.has(p.id));
  const completedIds = new Set(completed.map((p) => p.id));
  const fraction = total === 0 ? 0 : completed.length / total;
  const allComplete = completed.length === total && total > 0;

  return (
    <Popover as="div" className="relative flex flex-1 items-center">
      <PopoverButton
        as="button"
        aria-label={`Round progress: ${completed.length} of ${total} players entered`}
        className="glass relative h-6 w-full overflow-hidden rounded-full cursor-pointer"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-pt-green-500 transition-[width] duration-300 ease-out"
          style={{ width: `${fraction * 100}%` }}
        />
      </PopoverButton>
      <PopoverPanel portal anchor={{ to: "top", gap: 8 }} className="z-50 p-3 max-w-[18rem] w-max">
        <p className="text-sm font-semibold text-text-primary">
          {completed.length} of {total}
        </p>

        {players.length > 0 && (
          <ul className="mt-2 flex min-w-44 flex-col gap-1.5">
            {players.map((p) => {
              const isComplete = completedIds.has(p.id);
              return (
                <li
                  key={p.id}
                  data-progress-player-row
                  className="grid grid-cols-[auto_1fr_1rem] items-center gap-2 text-sm"
                >
                  <span data-player-avatar>
                    <PlayerAvatar player={p} size={14} />
                  </span>
                  <span className="truncate">{p.name}</span>
                  <span className="sr-only">{isComplete ? " score entered" : " score needed"}</span>
                  <span className="inline-flex justify-end">
                    {isComplete && (
                      <Check
                        data-progress-player-check
                        className="size-4 text-pt-green-500"
                        aria-hidden
                      />
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {allComplete && !hasRoundWinner && (
          <p className="mt-2 text-sm text-text-secondary">Mark a Round Winner to save.</p>
        )}

        {allComplete && hasRoundWinner && (
          <p className="mt-2 text-sm text-text-secondary">Ready to save.</p>
        )}
      </PopoverPanel>
    </Popover>
  );
}
