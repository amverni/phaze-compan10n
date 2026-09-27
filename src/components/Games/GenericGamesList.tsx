import { useQuery } from "@tanstack/react-query";
import { genericGameListOptions, useDeleteGenericGame } from "../../data/hooks/useGenericGames";
import { InlineError, List } from "../ui";
import { GameListRow } from "./GameListRow";

export function GenericGamesList({ activeOnly = false }: { activeOnly?: boolean }) {
  const { data: games, isPending, isError, refetch } = useQuery(genericGameListOptions(activeOnly));
  const deleteGame = useDeleteGenericGame();
  return (
    <section className="flex w-full min-h-0 flex-col">
      <h2 className="pb-3 text-sm font-semibold text-text-secondary">
        {activeOnly ? "Active Games" : "Games"}
      </h2>
      {deleteGame.isError && <InlineError message={deleteGame.error.message} />}
      {isError ? (
        <InlineError
          message={activeOnly ? "Unable to load Active Games." : "Unable to load Games."}
          onRetry={() => refetch()}
        />
      ) : (
        <List
          scrollable
          className="min-h-0"
          isLoading={isPending}
          shimmerRows={3}
          emptyMessage={activeOnly ? "No active games yet" : "No games yet"}
        >
          {games?.map((game) => (
            <GameListRow
              key={game.id}
              game={game}
              destination={{ to: "/game/$gameId", params: { gameId: game.id } }}
              onDelete={() => deleteGame.mutate(game.id)}
              isDeleting={deleteGame.isPending}
            />
          ))}
        </List>
      )}
    </section>
  );
}
