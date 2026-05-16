import type { PhaseStatus, RoundScore } from "../../types";

interface PlayerResultCellProps {
  /** RoundScore for the player in this round. Omitted for the ghost row. */
  score?: RoundScore;
  /** Phase number to display; for completed rows == score.currentPhase, for ghost == next phase. */
  phaseNumber: number;
  /** True when this is the dealer's cell for the round. */
  isDealer: boolean;
  /** True when this player won (went out in) this round. */
  isRoundWinner: boolean;
  /** "completed" renders status icon + colored phase; "ghost" renders neutral phase, no icon. */
  variant: "completed" | "ghost";
  /** Optional extra content rendered below the cell (per-round + running tiebreaker values). */
  extras?: React.ReactNode;
}

const PHASE_TEXT_CLASS: Record<PhaseStatus, string> = {
  completed: "text-[#27500A] dark:text-[#7DD86A]",
  failed: "text-[#A32D2D] dark:text-[#FF8585]",
  skipped: "text-[#B45309] dark:text-[#FACC15]",
  satOut: "text-text-secondary",
};

const ICON_CLASS: Record<PhaseStatus, string> = {
  completed: "text-[#3B6D11] dark:text-[#9CE07F]",
  failed: "text-[#A32D2D] dark:text-[#FF8585]",
  skipped: "text-[#B45309] dark:text-[#FACC15]",
  satOut: "text-text-secondary",
};

const ICON_CHAR: Record<PhaseStatus, string> = {
  completed: "✓",
  failed: "✕",
  skipped: "⤴",
  satOut: "—",
};

export function PlayerResultCell({
  score,
  phaseNumber,
  isDealer,
  isRoundWinner,
  variant,
  extras,
}: PlayerResultCellProps) {
  const status = score?.phaseStatus;
  const isGhost = variant === "ghost";

  const phaseColor = isGhost
    ? "text-text-secondary"
    : (status && PHASE_TEXT_CLASS[status]) || "text-text-primary";

  const iconColor = isGhost
    ? "text-text-secondary"
    : (status && ICON_CLASS[status]) || "text-text-secondary";

  return (
    <div className={`relative flex w-full flex-col items-center ${isGhost ? "opacity-55" : ""}`}>
      <div className="flex w-full items-center justify-center">
        {isDealer && (
          <span
            aria-hidden
            className={`absolute left-[3px] inline-flex size-[15px] items-center justify-center rounded-full text-[9px] font-medium leading-none ${
              isGhost ? "opacity-60" : ""
            }`}
            style={{ backgroundColor: "#FAC775", color: "#412402" }}
          >
            D
          </span>
        )}
        <span className={`relative text-base font-medium leading-none tabular-nums ${phaseColor}`}>
          {isRoundWinner && (
            <span
              aria-hidden
              className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 size-6 rounded-full border border-current"
            />
          )}
          {phaseNumber}
        </span>
        {!isGhost && status && (
          <span aria-hidden className={`absolute right-[5px] text-xs leading-none ${iconColor}`}>
            {ICON_CHAR[status]}
          </span>
        )}
      </div>
      {extras}
    </div>
  );
}
