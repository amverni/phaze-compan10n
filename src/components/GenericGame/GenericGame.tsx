import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { genericGameDetailOptions } from "../../data/hooks/useGenericGames";
import type { GameId } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";
import { Button, InlineError } from "../ui";

export function GenericGame({ gameId }: { gameId: GameId }) {
  const { data: view, isPending, isError, refetch } = useQuery(genericGameDetailOptions(gameId));

  return (
    <ScorekeeperShell
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
              <section
                aria-label="Scoreboard"
                // biome-ignore lint/a11y/noNoninteractiveTabindex: Native scroll regions need focus for keyboard scrolling.
                tabIndex={0}
                className={[
                  "min-h-0 overflow-auto rounded-2xl border border-text-secondary/20",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-secondary",
                ].join(" ")}
              >
                <table className="w-full border-collapse text-center">
                  <caption className="sr-only">Points scoreboard</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="px-4 py-3 text-sm">
                        Round
                      </th>
                      {view.players.map((player) => (
                        <th key={player.id} scope="col" className="min-w-28 px-4 py-3">
                          <span className="inline-flex flex-col items-center gap-2">
                            <PlayerAvatar player={player} />
                            <span className="text-sm">{player.name}</span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={view.players.length + 1}
                        className="border-t border-text-secondary/20 px-4 py-8 text-sm text-text-secondary"
                      >
                        No rounds yet.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
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
