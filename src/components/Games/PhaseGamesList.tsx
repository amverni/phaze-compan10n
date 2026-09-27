import { useQuery } from "@tanstack/react-query";
import { gameListOptions, useDeleteGame } from "../../data/hooks/useGames";
import { InlineError, List } from "../ui";
import { GameListRow } from "./GameListRow";

export function PhaseGamesList({ activeOnly = false }: { activeOnly?: boolean }) {
  const { data: games, isPending, isError, refetch } = useQuery(gameListOptions(activeOnly));
  const deleteGame = useDeleteGame();
  return (
    <div className="flex h-full min-h-0 flex-col pb-[var(--slant)]">
      <h2 className="px-1 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {activeOnly ? "Active Games" : "Games"}
      </h2>
      {deleteGame.isError && <InlineError message={deleteGame.error.message} />}
      {isError ? (
        <InlineError
          message={activeOnly ? "Unable to load active games." : "Unable to load games."}
          onRetry={() => refetch()}
        />
      ) : (
        <List
          scrollable
          className="active-games-scroll min-h-0"
          isLoading={isPending}
          shimmerRows={3}
          emptyMessage={activeOnly ? "No active games yet" : "No games yet"}
        >
          {games?.map((game) => (
            <GameListRow
              key={game.id}
              game={game}
              destination={{ to: "/phaseCompan10n/game/$gameId", params: { gameId: game.id } }}
              onDelete={() => deleteGame.mutate(game.id)}
              isDeleting={deleteGame.isPending}
            />
          ))}
        </List>
      )}
    </div>
  );
}
