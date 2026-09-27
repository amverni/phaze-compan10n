import { DialogTitle } from "@headlessui/react";
import type { GenericScoreboardView } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { StandingsList, standingsRowClasses } from "../Standings/StandingsList";
import { Button, Dialog, DialogScrollArea, numberCircleClasses } from "../ui";

interface GenericStandingsDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  standings: GenericScoreboardView["standings"];
  metric: "Points" | "Wins" | "Passes";
}

export function GenericStandingsDialog({
  open,
  onClose,
  standings,
  metric,
}: GenericStandingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-2 pb-4">
        <DialogTitle className="shrink-0 text-center text-lg font-semibold">Standings</DialogTitle>
        <DialogScrollArea aria-label={`${metric === "Wins" ? "Rounds Won" : metric} Standings`}>
          <StandingsList scorekeeper="generic">
            {standings.map((row) => (
              <li key={row.player.id} className={standingsRowClasses}>
                <span className="sr-only">Place {row.place}</span>
                <span className={numberCircleClasses} aria-hidden>
                  {row.place}
                </span>
                <PlayerAvatar player={row.player} size={16} variant="icon" />
                <span className="min-w-0 flex-1 truncate font-medium" title={row.player.name}>
                  {row.player.name}
                </span>
                <span className="shrink-0 text-right font-semibold whitespace-nowrap tabular-nums">
                  <span className="sr-only">Total {metric}: </span>
                  {"totalPoints" in row
                    ? row.totalPoints
                    : "totalWins" in row
                      ? row.totalWins
                      : row.totalPasses}
                  {"totalTiebreaker" in row && row.totalTiebreaker !== undefined && (
                    <span className="block text-xs font-normal text-text-secondary">
                      <span className="sr-only">Total Tiebreaker: </span>
                      {row.totalTiebreaker}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </StandingsList>
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
