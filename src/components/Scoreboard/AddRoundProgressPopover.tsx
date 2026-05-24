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
  const incomplete = players.filter((p) => !completedPlayerIds.has(p.id));
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
          className="absolute inset-y-0 left-0 bg-emerald-500/70 dark:bg-emerald-400/70 transition-[width] duration-300 ease-out"
          style={{ width: `${fraction * 100}%` }}
        />
      </PopoverButton>
      <PopoverPanel portal anchor={{ to: "top", gap: 8 }} className="z-50 p-3 max-w-[18rem] w-max">
        <p className="text-sm font-semibold text-text-primary">
          {completed.length} of {total}
        </p>

        {!allComplete && incomplete.length > 0 && (
          <>
            <p className="mt-2 text-xs text-text-secondary">Waiting on:</p>
            <ul className="mt-1 flex flex-col gap-1.5">
              {incomplete.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <PlayerAvatar player={p} size={14} />
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          </>
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
