import { DialogTitle } from "@headlessui/react";
import type { GenericScoreboardView } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { Button, Dialog, DialogScrollArea, List, numberCircleClasses } from "../ui";

interface GenericStandingsDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  standings: GenericScoreboardView["standings"];
}

export function GenericStandingsDialog({ open, onClose, standings }: GenericStandingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-2 pb-4">
        <DialogTitle className="shrink-0 text-center text-lg font-semibold">Standings</DialogTitle>
        <DialogScrollArea aria-label="Points Standings">
          <List role="list" aria-label="Standings places">
            {standings.map((row) => (
              <li key={row.player.id} className="flex w-full min-w-0 items-center gap-2 text-sm">
                <span className="sr-only">Place {row.place}</span>
                <span className={numberCircleClasses} aria-hidden>
                  {row.place}
                </span>
                <PlayerAvatar player={row.player} size={16} variant="icon" />
                <span className="min-w-0 flex-1 truncate font-medium" title={row.player.name}>
                  {row.player.name}
                </span>
                <span className="shrink-0 font-semibold tabular-nums">
                  <span className="sr-only">Total Points: </span>
                  {row.totalPoints}
                </span>
              </li>
            ))}
          </List>
        </DialogScrollArea>
        <div className="mt-auto flex shrink-0 justify-end px-2 pt-2">
          <Button
            type="button"
            onClick={() => onClose(false)}
            className="min-h-11 px-5 text-sm data-focus:outline-text-secondary!"
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
