import type { GameTiebreaker, Player, Round } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { formatTiebreaker, getCurrentPhase, getRunningTiebreakerTotal } from "./scoreboardUtils";

interface ScoreboardHeaderProps {
  players: Player[];
  rounds: Round[];
  totalPhases: number;
  tiebreaker: GameTiebreaker;
  playerCount: number;
}

export function ScoreboardHeader({
  players,
  rounds,
  totalPhases,
  tiebreaker,
}: ScoreboardHeaderProps) {
  const lastRoundNumber = rounds.length > 0 ? Math.max(...rounds.map((r) => r.roundNumber)) : 0;

  return (
    <>
      {/* Top-left empty corner cell */}
      <div className="scoreboard-cell scoreboard-cell--sticky-corner" aria-hidden />
      {players.map((player, idx) => {
        const isLast = idx === players.length - 1;
        const phase = getCurrentPhase(player.id, rounds, totalPhases);
        const tbValue = getRunningTiebreakerTotal(rounds, player.id, tiebreaker, lastRoundNumber);
        return (
          <div
            key={player.id}
            className={`scoreboard-cell scoreboard-cell--sticky-top ${
              isLast ? "scoreboard-cell--last-col" : ""
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <PlayerAvatar player={player} variant="icon-initials" />
              <span className="text-2xl font-medium leading-none tabular-nums text-text-primary">
                {phase}
              </span>
              <span className="text-[11px] leading-none text-text-secondary tabular-nums">
                {formatTiebreaker(tbValue, tiebreaker)}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
