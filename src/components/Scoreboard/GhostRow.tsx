import type { ActiveGame, Player, Round } from "../../types";
import { PlayerResultCell } from "./PlayerResultCell";
import { getCurrentPhase, getDealerId } from "./scoreboardUtils";

interface GhostRowProps {
  game: ActiveGame;
  rounds: Round[];
  players: Player[];
  totalPhases: number;
  onOpenAddRound: () => void;
}

export function GhostRow({ game, rounds, players, totalPhases, onOpenAddRound }: GhostRowProps) {
  const nextRoundNumber = rounds.length + 1;
  const dealerId = getDealerId(nextRoundNumber, game.activePlayers);

  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenAddRound();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpenAddRound}
        onKeyDown={onKeyDown}
        aria-label={`Add round ${nextRoundNumber}`}
        className="scoreboard-cell scoreboard-cell--sticky-left scoreboard-cell--dashed scoreboard-cell--last-row text-left"
      >
        <span
          className="inline-flex size-5 items-center justify-center rounded-full border-[1.5px] border-text-secondary/60 text-text-secondary"
          aria-hidden
        >
          <span className="-mt-px text-sm leading-none">+</span>
        </span>
      </button>

      {players.map((player, idx) => {
        const isLast = idx === players.length - 1;
        const phaseNumber = getCurrentPhase(player.id, rounds, totalPhases);
        return (
          <div
            key={player.id}
            className={`scoreboard-cell scoreboard-cell--dashed scoreboard-cell--last-row ${
              isLast ? "scoreboard-cell--last-col" : ""
            }`}
          >
            <PlayerResultCell
              phaseNumber={phaseNumber}
              isDealer={dealerId === player.id}
              isRoundWinner={false}
              variant="ghost"
            />
          </div>
        );
      })}
    </>
  );
}
