import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChartNoAxesColumn, Flag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  genericGameScoreboardOptions,
  useFinishGenericGame,
} from "../../data/hooks/useGenericGames";
import type { GameId } from "../../types";
import { FinishGameDialog } from "../Game/FinishGameDialog";
import { shouldAutoOpenStandings } from "../Game/standingsAutoOpen";
import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";
import { Button, InlineError } from "../ui";
import { GenericScoreboard } from "./GenericScoreboard";
import { GenericStandingsDialog } from "./GenericStandingsDialog";

export function GenericGame({ gameId }: { gameId: GameId }) {
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const checkedInitialStandingsGameId = useRef<GameId | null>(null);
  const openFinalStandingsAfterFinish = useRef(false);
  const finishGame = useFinishGenericGame();
  const navigate = useNavigate();
  const {
    data: view,
    isPending,
    isError,
    refetch,
  } = useQuery(genericGameScoreboardOptions(gameId));

  useEffect(() => {
    if (!view || checkedInitialStandingsGameId.current === view.game.id) return;
    checkedInitialStandingsGameId.current = view.game.id;
    if (shouldAutoOpenStandings(view.game.status, view.game.id, null)) {
      setStandingsOpen(true);
    }
  }, [view]);

  return (
    <>
      <ScorekeeperShell
        headerContent={
          <div className="content-container flex h-full items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <ScorekeeperLogo height={64} />
            </div>
            {view && (
              <Button
                type="button"
                aria-label="Open Standings"
                disabled={isError}
                onClick={() => setStandingsOpen(true)}
                className="size-12 shrink-0 data-focus:outline-text-secondary!"
              >
                <ChartNoAxesColumn className="size-8" aria-hidden />
              </Button>
            )}
          </div>
        }
        mainContent={
          <div className="flex h-full min-h-0 flex-col p-4">
            {isPending ? (
              <output>Loading Game...</output>
            ) : isError ? (
              <InlineError message="Unable to load this Game." onRetry={() => refetch()} />
            ) : !view ? (
              <output>Game not found in Scorekeeper.</output>
            ) : (
              <>
                <p className="pb-4 text-center text-sm text-text-secondary">
                  Points -{" "}
                  {view.game.settings.pointsDirection === "high" ? "High wins" : "Low wins"}
                </p>
                <GenericScoreboard key={view.game.id} view={view} />
                <GenericStandingsDialog
                  open={standingsOpen}
                  onClose={setStandingsOpen}
                  standings={view.standings}
                />
              </>
            )}
          </div>
        }
        footerContent={
          <div className="content-container flex h-full justify-between">
            <Button as={Link} to="/" aria-label="Go home" className="page-shell-footer-button p-0">
              <ArrowLeft className="size-8" aria-hidden />
            </Button>
            {view?.game.status === "active" && (
              <Button
                type="button"
                aria-label="Finish Game"
                className="page-shell-footer-button p-0"
                disabled={isError}
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
        canFinish={Boolean(view?.rounds.length) && !isError}
        isPending={finishGame.isPending}
        error={finishGame.error ? `Couldn't finish Game: ${finishGame.error.message}` : null}
        onResume={() => setFinishOpen(false)}
        onPause={() => navigate({ to: "/" })}
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
    </>
  );
}
