import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChartNoAxesColumn, Flag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gameDetailOptions, useFinishGame } from "../../data/hooks/useGames";
import { useGamePlayers } from "../../data/hooks/usePlayers";
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
import { FinishGameDialog } from "./FinishGameDialog";
import { shouldShowPhasesCardEntryButton } from "./gameView";
import { shouldAutoOpenStandings } from "./standingsAutoOpen";

interface GameProps {
  gameId: GameId;
}

export function Game({ gameId }: GameProps) {
  const [phasesCardOpen, setPhasesCardOpen] = useState(false);
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const openFinalStandingsAfterFinish = useRef(false);
  const finishGame = useFinishGame();
  const navigate = useNavigate();
  const checkedInitialStandingsGameId = useRef<GameId | null>(null);
  const { data: game } = useQuery(gameDetailOptions(gameId));
  const players = useGamePlayers(game);
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
            <div className="card-header-controls absolute inset-x-0 top-0 z-10 flex items-center px-4">
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
              <Button
                type="button"
                className="ml-auto size-12 p-0"
                aria-label="Open Standings"
                disabled={!standingsReady}
                onClick={() => setStandingsOpen(true)}
              >
                <ChartNoAxesColumn className="size-8" aria-hidden />
              </Button>
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
            <Button
              as={Link}
              to="/phaseCompan10n"
              className="card-footer-button p-0"
              aria-label="Go home"
            >
              <ArrowLeft className="size-8" aria-hidden />
            </Button>
            {game?.status === "active" && (
              <Button
                type="button"
                className="card-footer-button p-0"
                aria-label="Finish Game"
                disabled={!standingsReady}
                onClick={() => {
                  finishGame.reset();
                  setFinishOpen(true);
                }}
              >
                <Flag className="size-8" aria-hidden />
              </Button>
            )}
          </div>
        }
      />
      <FinishGameDialog
        open={finishOpen}
        canFinish={Boolean(rounds?.length)}
        isPending={finishGame.isPending}
        error={finishGame.error ? `Couldn't finish Game: ${finishGame.error.message}` : null}
        onResume={() => setFinishOpen(false)}
        onPause={() => navigate({ to: "/phaseCompan10n" })}
        afterLeave={() => {
          if (openFinalStandingsAfterFinish.current) {
            openFinalStandingsAfterFinish.current = false;
            setStandingsOpen(true);
          }
        }}
        onFinish={() =>
          finishGame.mutate(gameId, {
            onSuccess: () => {
              openFinalStandingsAfterFinish.current = true;
              setFinishOpen(false);
            },
          })
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
