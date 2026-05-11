import { Button } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Play, Trash } from "lucide-react";
import { activeGamesOptions, useDeleteGame } from "../../data/hooks/useGames";
import { playerListOptions } from "../../data/hooks/usePlayers";
import type { ActiveGame, Player, PlayerId } from "../../types";
import { PlayerAvatarStack } from "../PlayerAvatarStack/PlayerAvatarStack";
import { InlineError, List } from "../ui";

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  if (diff < 365 * day) return `${Math.floor(diff / (30 * day))}mo ago`;
  return `${Math.floor(diff / (365 * day))}y ago`;
}

interface ActiveGameRowProps {
  game: ActiveGame;
  playersById: Map<PlayerId, Player>;
}

function ActiveGameRow({ game, playersById }: ActiveGameRowProps) {
  const deleteGame = useDeleteGame();
  const players = game.activePlayers
    .map((id) => playersById.get(id))
    .filter((p): p is Player => p !== undefined);
  const playerSummary = players.map((p) => p.name).join(", ") || "no players";

  function handleDelete() {
    deleteGame.mutate(game.id);
  }

  return (
    <div className="group/row relative -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center text-sm [&:hover:not(:has(.trash-btn:hover))]:bg-black/5 dark:[&:hover:not(:has(.trash-btn:hover))]:bg-white/10">
      <Link
        to="/game/$gameId"
        params={{ gameId: game.id }}
        aria-label={`Continue game with ${playerSummary}`}
        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 pl-3 pr-2 text-left"
      >
        <PlayerAvatarStack players={players} />
        <span className="ml-1 shrink-0 whitespace-nowrap text-text-secondary">
          {formatRelativeTime(game.createdAt)}
        </span>
        <Play className="ml-2 h-4 w-4 shrink-0 fill-none text-text-secondary group-hover/row:fill-blue-500 group-hover/row:text-blue-500 group-has-[.trash-btn:hover]/row:fill-none group-has-[.trash-btn:hover]/row:text-text-secondary" />
      </Link>
      <Button
        className="group/trash trash-btn mx-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:bg-black/5 hover:text-red-500! dark:hover:bg-white/10"
        onClick={handleDelete}
        aria-label={`Delete game with ${playerSummary}`}
      >
        <Trash className="h-4 w-4 shrink-0 fill-none group-hover/trash:fill-current" />
      </Button>
    </div>
  );
}

export function ActiveGames() {
  const {
    data: games,
    isLoading: gamesLoading,
    isError: gamesError,
    refetch,
  } = useQuery(activeGamesOptions());

  const { data: players } = useQuery(playerListOptions());

  const playersById = new Map((players ?? []).map((p) => [p.id, p]));

  return (
    <div className="flex h-full min-h-0 flex-col pb-[var(--slant)]">
      <h2 className="px-1 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        Active Games
      </h2>
      {gamesError ? (
        <InlineError message="Unable to load active games." onRetry={() => refetch()} />
      ) : (
        <List
          scrollable
          className="active-games-scroll min-h-0"
          isLoading={gamesLoading}
          shimmerRows={3}
          emptyMessage="No active games yet"
        >
          {games?.map((game) => (
            <ActiveGameRow key={game.id} game={game} playersById={playersById} />
          ))}
        </List>
      )}
    </div>
  );
}
