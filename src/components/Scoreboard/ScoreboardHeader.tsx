import type { GameTiebreaker, PlayerId, PlayerIdentity, Round } from "../../types";
import { ScoreboardPlayerName } from "./ScoreboardPlayerName";
import { formatTiebreaker, getCurrentPhase, getRunningTiebreakerTotal } from "./scoreboardUtils";

interface ScoreboardHeaderProps {
  players: PlayerIdentity[];
  rounds: Round[];
  totalPhases: number;
  tiebreaker: GameTiebreaker;
  namesExpanded: boolean;
  onToggleNames: () => void;
  upcomingDealerId: PlayerId | null;
}

export function ScoreboardHeader({
  players,
  rounds,
  totalPhases,
  tiebreaker,
  upcomingDealerId,
  namesExpanded,
  onToggleNames,
}: ScoreboardHeaderProps) {
  const lastRoundNumber = rounds.length > 0 ? Math.max(...rounds.map((r) => r.roundNumber)) : 0;

  return (
    <>
      {/* Top-left empty corner cell */}
      <div className="scoreboard-cell scoreboard-cell--sticky-corner" aria-hidden />
      {players.map((player, idx) => {
        const isLast = idx === players.length - 1;
        const isUpcomingDealer = player.id === upcomingDealerId;
        const phase = getCurrentPhase(player.id, rounds, totalPhases);
        const tbValue = getRunningTiebreakerTotal(rounds, player.id, tiebreaker, lastRoundNumber);
        return (
          <div
            key={player.id}
            className={[
              "scoreboard-cell scoreboard-cell--sticky-top",
              isLast ? "scoreboard-cell--last-col" : "",
              isUpcomingDealer ? "scoreboard-cell--upcoming-dealer" : "",
            ].join(" ")}
          >
            {isUpcomingDealer && (
              <span className="sr-only">Upcoming Round Dealer: {player.name}</span>
            )}
            <div className="flex flex-col items-center gap-1">
              <ScoreboardPlayerName
                player={player}
                expanded={namesExpanded}
                onToggle={onToggleNames}
              />
              <span className="text-2xl font-medium leading-none tabular-nums text-text-primary">
                {phase}
              </span>
              <span className="text-sm leading-none text-text-secondary tabular-nums">
                {formatTiebreaker(tbValue, tiebreaker)}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
}
