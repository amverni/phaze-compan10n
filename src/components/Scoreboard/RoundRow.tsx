import type { Game, GameTiebreaker, Player, PlayerId, Round } from "../../types";
import { PlayerResultCell } from "./PlayerResultCell";
import {
  formatTiebreaker,
  getDealerId,
  getRunningTiebreakerTotal,
  getTiebreakerValue,
} from "./scoreboardUtils";

interface RoundRowProps {
  round: Round;
  allRounds: Round[];
  players: Player[];
  game: Game;
  tiebreaker: GameTiebreaker;
  isExpanded: boolean;
  isLastRow: boolean;
  onToggle: () => void;
}

export function RoundRow({
  round,
  allRounds,
  players,
  game,
  tiebreaker,
  isExpanded,
  isLastRow,
  onToggle,
}: RoundRowProps) {
  const activePlayers: PlayerId[] = game.status === "active" ? game.activePlayers : game.players;
  const dealerId = getDealerId(round.roundNumber, activePlayers);

  const lastColClass = (idx: number) =>
    idx === players.length - 1 ? "scoreboard-cell--last-col" : "";
  const lastRowClass = isLastRow ? "scoreboard-cell--last-row" : "";

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`Round ${round.roundNumber}${isExpanded ? ", expanded" : ""}`}
        className={`scoreboard-cell scoreboard-cell--sticky-left text-left ${lastRowClass}`}
      >
        <span className="text-xs font-medium leading-none tabular-nums text-text-secondary">
          {round.roundNumber}
        </span>
      </button>

      {players.map((player, idx) => {
        const score = round.scores.find((s) => s.playerId === player.id);
        const phaseNumber = score?.currentPhase ?? 0;
        const tbValue = getTiebreakerValue(round, player.id, tiebreaker);
        const runningTotal = getRunningTiebreakerTotal(
          allRounds,
          player.id,
          tiebreaker,
          round.roundNumber,
        );

        return (
          <div key={player.id} className={`scoreboard-cell ${lastColClass(idx)} ${lastRowClass}`}>
            <PlayerResultCell
              score={score}
              phaseNumber={phaseNumber}
              isDealer={dealerId === player.id}
              isRoundWinner={round.roundWinnerId === player.id}
              variant="completed"
              extras={
                <div className={`scoreboard-extras ${isExpanded ? "scoreboard-extras--open" : ""}`}>
                  <div>
                    <span className="text-[11px] leading-none text-text-secondary tabular-nums">
                      {formatTiebreaker(tbValue, tiebreaker)}
                    </span>
                    <span className="text-[11px] leading-none text-text-secondary/70 tabular-nums">
                      Σ {formatTiebreaker(runningTotal, tiebreaker)}
                    </span>
                  </div>
                </div>
              }
            />
          </div>
        );
      })}
    </>
  );
}
