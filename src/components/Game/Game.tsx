import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChartNoAxesColumn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gameDetailOptions, useDeleteEmptyGame, useFinishGame } from "../../data/hooks/useGames";
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
import { Button, InlineError } from "../ui";
import { FinishGameMenu } from "./FinishGameMenu";
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
  const deleteGame = useDeleteEmptyGame();
  const navigate = useNavigate();
  const checkedInitialStandingsGameId = useRef<GameId | null>(null);
  const gameQuery = useQuery(gameDetailOptions(gameId));
  const { data: game } = gameQuery;
  const playersQuery = useGamePlayers(game);
  const { data: players } = playersQuery;
  const roundsQuery = useQuery({ ...roundsListOptions(gameId), enabled: !!game });
  const { data: rounds } = roundsQuery;
  const hasLoadError = gameQuery.isError || playersQuery.isError || roundsQuery.isError;
  const standingsReady = Boolean(game && players && rounds) && !hasLoadError;
  const actionReady =
    gameQuery.isSuccess &&
    !gameQuery.isFetching &&
    !gameQuery.isStale &&
    roundsQuery.isSuccess &&
    !roundsQuery.isFetching &&
    !roundsQuery.isStale;
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
            <div className="content-container card-header-controls absolute inset-x-0 top-0 z-10 flex items-center">
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
                className="page-shell-button ml-auto p-0"
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
            {hasLoadError && (
              <InlineError
                message="Unable to load this Game."
                onRetry={() => {
                  if (gameQuery.isError) gameQuery.refetch();
                  if (playersQuery.isError) playersQuery.refetch();
                  if (roundsQuery.isError) roundsQuery.refetch();
                }}
              />
            )}
            {game === null ? (
              <p className="text-text-secondary flex flex-1 items-center justify-center text-center">
                This Game is no longer available.
              </p>
            ) : game && players && rounds ? (
              <div className="min-h-0 flex-1" inert={hasLoadError}>
                <Scoreboard
                  game={game}
                  rounds={rounds}
                  players={players}
                  onGameCompleted={() => setStandingsOpen(true)}
                />
              </div>
            ) : !hasLoadError ? (
              <p className="text-text-secondary flex flex-1 items-center justify-center text-center">
                Loading…
              </p>
            ) : null}
          </div>
        }
        footerContent={
          <div className="content-container flex h-full justify-between">
            <Button
              as={Link}
              to="/phaseCompan10n"
              className="page-shell-button p-0"
              aria-label="Go home"
            >
              <ArrowLeft className="size-8" aria-hidden />
            </Button>
            <FinishGameMenu
              open={finishOpen}
              active={game?.status === "active"}
              action={actionReady ? (rounds?.length === 0 ? "delete" : "finish") : null}
              onOpenChange={setFinishOpen}
              onPause={() => navigate({ to: "/phaseCompan10n" })}
              afterClose={() => {
                if (openFinalStandingsAfterFinish.current) {
                  openFinalStandingsAfterFinish.current = false;
                  setStandingsOpen(true);
                }
              }}
              onFinish={async () => {
                await finishGame.mutateAsync(gameId);
                openFinalStandingsAfterFinish.current = true;
                setFinishOpen(false);
              }}
              onDelete={async () => {
                await deleteGame.mutateAsync(gameId);
                await navigate({ to: "/phaseCompan10n" });
              }}
            />
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
