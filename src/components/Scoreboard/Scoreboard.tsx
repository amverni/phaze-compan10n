import { useEffect, useRef, useState } from "react";
import type { Game, Player, Round } from "../../types";
import { AddRoundDialog } from "./AddRoundDialog";
import { GhostRow } from "./GhostRow";
import { RoundRow } from "./RoundRow";
import { ScoreboardHeader } from "./ScoreboardHeader";
import { useAddRoundDraft } from "./useAddRoundDraft";
import "./scoreboard.css";

interface ScoreboardProps {
  game: Game;
  rounds: Round[];
  players: Player[];
}

export function Scoreboard({ game, rounds, players }: ScoreboardProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Outside-click collapses any expanded row. Use mousedown so it fires
  // before potential click handlers, and ignore events inside the grid.
  useEffect(() => {
    if (expandedRound === null) return;
    const handler = (event: MouseEvent) => {
      const node = rootRef.current;
      if (!node) return;
      if (node.contains(event.target as Node)) return;
      setExpandedRound(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expandedRound]);

  const sortedRounds = rounds.slice().sort((a, b) => a.roundNumber - b.roundNumber);
  const totalPhases = game.phaseSet.phases.length;
  const tiebreaker = game.settings.tiebreaker;
  const isActive = game.status === "active";

  // Re-order players column-wise to match the active-player order (so the
  // dealer rotation matches the visual order). Falls back to game.players.
  const orderedIds = isActive ? game.activePlayers : game.players;
  const playerById = new Map(players.map((p) => [p.id, p]));
  const orderedPlayers = orderedIds
    .map((id) => playerById.get(id))
    .filter((p): p is Player => p !== undefined);

  const showGhost = isActive;
  const draft = useAddRoundDraft(orderedPlayers, game.settings);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <section
        ref={rootRef}
        aria-label="Scoreboard"
        className="glass relative min-h-0 flex-1 overflow-auto rounded-2xl"
      >
        <div
          className="scoreboard"
          style={
            {
              "--player-count": orderedPlayers.length,
            } as React.CSSProperties
          }
        >
          <ScoreboardHeader
            players={orderedPlayers}
            rounds={sortedRounds}
            totalPhases={totalPhases}
            tiebreaker={tiebreaker}
            playerCount={orderedPlayers.length}
          />

          {sortedRounds.map((round, idx) => {
            const isLastRow = idx === sortedRounds.length - 1;
            return (
              <RoundRow
                key={round.roundNumber}
                round={round}
                allRounds={sortedRounds}
                players={orderedPlayers}
                game={game}
                tiebreaker={tiebreaker}
                isExpanded={expandedRound === round.roundNumber}
                isLastRow={isLastRow}
                onToggle={() =>
                  setExpandedRound((prev) =>
                    prev === round.roundNumber ? null : round.roundNumber,
                  )
                }
              />
            );
          })}

          {showGhost && (
            <GhostRow
              game={game}
              rounds={sortedRounds}
              players={orderedPlayers}
              totalPhases={totalPhases}
              onOpenAddRound={() => setDialogOpen(true)}
            />
          )}
        </div>
      </section>

      {isActive && (
        <AddRoundDialog
          open={dialogOpen}
          onClose={setDialogOpen}
          game={game}
          players={orderedPlayers}
          draft={draft}
        />
      )}
    </div>
  );
}
