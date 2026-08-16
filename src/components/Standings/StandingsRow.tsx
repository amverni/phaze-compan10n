import { Check } from "lucide-react";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { numberCircleClasses } from "../ui";
import type { StandingsDisplayRow } from "./standingsDialogView";

interface StandingsRowProps {
  row: StandingsDisplayRow;
}

const standingsRowClasses = ["flex w-full min-w-0 items-center gap-3 text-sm"].join(" ");
const scoreClasses = [
  "grid shrink-0 grid-cols-[3.75rem_0.5rem_4.75rem] items-center gap-1",
  "tabular-nums",
].join(" ");
const phaseScoreClasses = [
  "inline-flex items-center justify-start gap-0.5 font-semibold text-text-primary",
].join(" ");

export function StandingsRow({ row }: StandingsRowProps) {
  const placeClasses = [numberCircleClasses, !row.showPlace && "opacity-0"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={standingsRowClasses}>
      <span className="sr-only">
        {row.showPlace ? `Place ${row.place}` : `Tied for place ${row.place}`}
      </span>
      <span className={placeClasses} aria-hidden>
        {row.place}
      </span>
      <PlayerAvatar player={row.player} size={16} variant="icon" />
      <span className="min-w-0 flex-1 truncate font-medium" title={row.player.name}>
        {row.player.name}
      </span>
      <span className={scoreClasses}>
        <span className={phaseScoreClasses}>
          Ph {row.phaseNumber}
          {row.isFinished && <Check className="size-3.5 text-pt-green-500" aria-label="Finished" />}
        </span>
        <span className="text-center text-text-secondary" aria-hidden>
          •
        </span>
        <span className="text-left text-text-secondary">{row.tiebreakerText}</span>
      </span>
    </div>
  );
}
