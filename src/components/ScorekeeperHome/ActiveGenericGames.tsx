import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Play, Trash } from "lucide-react";
import { activeGenericGamesOptions, useDeleteGenericGame } from "../../data/hooks/useGenericGames";
import { formatRelativeTime } from "../../utils";
import { PlayerAvatarStack } from "../PlayerAvatarStack/PlayerAvatarStack";
import { Button, InlineError, List } from "../ui";

const gameLinkClasses = [
  "flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none",
  "hover:text-pt-blue-500 focus-visible:outline-2 focus-visible:outline-text-secondary",
].join(" ");

export function ActiveGenericGames() {
  const { data: views, isPending, isError, refetch } = useQuery(activeGenericGamesOptions());
  const deleteGame = useDeleteGenericGame();

  return (
    <section className="w-full min-h-0">
      <h2 className="pb-3 text-sm font-semibold text-text-secondary">Active Games</h2>
      {deleteGame.error && (
        <div className="pb-3">
          <InlineError message={deleteGame.error.message} />
        </div>
      )}
      {isError ? (
        <InlineError message="Unable to load Active Games." onRetry={() => refetch()} />
      ) : (
        <List isLoading={isPending} shimmerRows={3} emptyMessage="No active games yet">
          {views?.map(({ game, players }) => {
            const summary = players.map((player) => player.name).join(", ");
            return (
              <div key={game.id} className="flex w-full min-w-0 items-center gap-3">
                <Link
                  to="/game/$gameId"
                  params={{ gameId: game.id }}
                  aria-label={`Continue game with ${summary}`}
                  className={gameLinkClasses}
                >
                  <PlayerAvatarStack players={players} />
                  <span className="truncate">{summary}</span>
                  <span className="shrink-0 text-text-secondary">
                    {formatRelativeTime(game.lastActivityAt)}
                  </span>
                  <Play className="ml-auto size-4 shrink-0" aria-hidden />
                </Link>
                <Button
                  aria-label={`Delete game with ${summary}`}
                  className="size-8 shrink-0 p-0"
                  disabled={deleteGame.isPending}
                  onClick={() => deleteGame.mutate(game.id)}
                >
                  <Trash className="size-4" aria-hidden />
                </Button>
              </div>
            );
          })}
        </List>
      )}
    </section>
  );
}
