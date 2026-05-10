import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { activeGamesOptions } from "../../data/hooks/useGames";
import { playerListOptions } from "../../data/hooks/usePlayers";
import type { ActiveGame, Player, PlayerId } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { InlineError, List } from "../ui";

const MAX_AVATARS = 4;

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
  const players = game.activePlayers
    .map((id) => playersById.get(id))
    .filter((p): p is Player => p !== undefined);
  const visible = players.slice(0, MAX_AVATARS);
  const hiddenCount = players.length - visible.length;
  const playerSummary = players.map((p) => p.name).join(", ") || "no players";

  return (
    <Link
      to="/game"
      search={{ gameId: game.id }}
      aria-label={`Continue game with ${playerSummary}`}
      className="relative -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center gap-3 px-3 outline-none hover:bg-black/5 focus-visible:bg-black/5 dark:hover:bg-white/10 dark:focus-visible:bg-white/10"
    >
      <div className="flex shrink-0 -space-x-2">
        {visible.map((player) => (
          <span
            key={player.id}
            className="ring-2 ring-white dark:ring-neutral-900 rounded-full inline-flex"
          >
            <PlayerAvatar color={player.color} size={16} />
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="ring-2 ring-white dark:ring-neutral-900 inline-flex size-6.5 items-center justify-center rounded-full bg-black/10 text-[10px] font-semibold text-text-secondary dark:bg-white/15">
            +{hiddenCount}
          </span>
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-text-secondary">
        {formatRelativeTime(game.createdAt)}
      </span>
      <ChevronRight className="size-4 shrink-0 text-text-secondary" />
    </Link>
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
