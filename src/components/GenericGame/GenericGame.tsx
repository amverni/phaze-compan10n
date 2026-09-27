import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChartNoAxesColumn } from "lucide-react";
import { useState } from "react";
import { genericGameScoreboardOptions } from "../../data/hooks/useGenericGames";
import type { GameId } from "../../types";
import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";
import { Button, InlineError } from "../ui";
import { GenericScoreboard } from "./GenericScoreboard";
import { GenericStandingsDialog } from "./GenericStandingsDialog";

export function GenericGame({ gameId }: { gameId: GameId }) {
  const [standingsOpen, setStandingsOpen] = useState(false);
  const {
    data: view,
    isPending,
    isError,
    refetch,
  } = useQuery(genericGameScoreboardOptions(gameId));

  return (
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
                Points - {view.game.settings.pointsDirection === "high" ? "High wins" : "Low wins"}
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
        <div className="content-container flex h-full">
          <Button as={Link} to="/" aria-label="Go home" className="page-shell-footer-button p-0">
            <ArrowLeft className="size-8" aria-hidden />
          </Button>
        </div>
      }
    />
  );
}
