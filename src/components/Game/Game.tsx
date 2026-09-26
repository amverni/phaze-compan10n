import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChartNoAxesColumn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gameDetailOptions } from "../../data/hooks/useGames";
import { playersByIdsOptions } from "../../data/hooks/usePlayers";
import { roundsListOptions } from "../../data/hooks/useRounds";
import type { GameId } from "../../types";
import { CardBackground } from "../CardBackground/CardBackground";
import { HeaderLogo } from "../Logo/HeaderLogo";
import {
  PhasesCardDialog,
  PhasesCardEntryButtonContent,
  phasesCardEntryButtonClasses,
} from "../PhasesCard";
import { Scoreboard } from "../Scoreboard";
import { StandingsDialog } from "../Standings";
import { Button } from "../ui";
import { shouldShowPhasesCardEntryButton } from "./gameView";
import { shouldAutoOpenStandings } from "./standingsAutoOpen";

interface GameProps {
  gameId: GameId;
}

export function Game({ gameId }: GameProps) {
  const [phasesCardOpen, setPhasesCardOpen] = useState(false);
  const [standingsOpen, setStandingsOpen] = useState(false);
  const checkedInitialStandingsGameId = useRef<GameId | null>(null);
  const { data: game } = useQuery(gameDetailOptions(gameId));
  const playerIds = game?.players ?? [];
  const { data: players } = useQuery(playersByIdsOptions(playerIds));
  const { data: rounds } = useQuery(roundsListOptions(gameId));
  const standingsReady = Boolean(game && players && rounds);
  const showPhasesCardEntryButton = game ? shouldShowPhasesCardEntryButton(game.status) : true;

  useEffect(() => {
    if (!game) return;
    if (checkedInitialStandingsGameId.current === game.id) return;
    checkedInitialStandingsGameId.current = game.id;
    if (shouldAutoOpenStandings(game.status, game.id, null)) {
      setStandingsOpen(true);
    }
  }, [game]);

  return (
    <>
      <CardBackground
        headerContent={
          <div className="relative flex h-full items-center">
            <HeaderLogo />
            <div className="relative z-10 mx-auto flex h-full w-full items-center px-4">
              {showPhasesCardEntryButton && (
                <Button
                  type="button"
                  aria-label="Open Phases Card"
                  className={phasesCardEntryButtonClasses}
                  disabled={!game}
                  onClick={() => {
                    if (game) setPhasesCardOpen(true);
                  }}
                >
                  <PhasesCardEntryButtonContent />
                </Button>
              )}
            </div>
          </div>
        }
        mainContent={
          <div className="content-container flex h-full min-h-0 flex-col py-4 pb-[calc(0.5rem+var(--slant))]">
            {game && players && rounds ? (
              <div className="min-h-0 flex-1">
                <Scoreboard
                  game={game}
                  rounds={rounds}
                  players={players}
                  onGameCompleted={() => setStandingsOpen(true)}
                />
              </div>
            ) : (
              <p className="text-text-secondary flex flex-1 items-center justify-center text-center">
                Loading…
              </p>
            )}
          </div>
        }
        footerContent={
          <div className="content-container flex h-full justify-between">
            <Button as={Link} to="/" className="card-footer-button p-0" aria-label="Go home">
              <ArrowLeft className="size-8" />
            </Button>
            <Button
              type="button"
              className="card-footer-button p-0"
              aria-label="Open Standings"
              disabled={!standingsReady}
              onClick={() => setStandingsOpen(true)}
            >
              <ChartNoAxesColumn className="size-8" aria-hidden />
            </Button>
          </div>
        }
      />
      {game && (
        <PhasesCardDialog
          open={phasesCardOpen}
          onClose={setPhasesCardOpen}
          phaseSet={game.phaseSet}
        />
      )}
      {game && players && rounds && (
        <StandingsDialog
          open={standingsOpen}
          onClose={setStandingsOpen}
          game={game}
          players={players}
          rounds={rounds}
        />
      )}
    </>
  );
}
