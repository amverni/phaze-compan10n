import { Link, type LinkOptions } from "@tanstack/react-router";
import { ChartNoAxesColumn, Play, Trash } from "lucide-react";
import type { GameListItem } from "../../types";
import { PlayerAvatarStack } from "../PlayerAvatarStack/PlayerAvatarStack";
import { Button } from "../ui";

interface GameListRowProps {
  game: GameListItem;
  destination: LinkOptions;
  onDelete: () => void;
  isDeleting: boolean;
}

export function GameListRow({ game, destination, onDelete, isDeleting }: GameListRowProps) {
  const playerSummary = game.players.map((player) => player.name).join(", ") || "no players";
  const completed = game.status === "completed";
  const Icon = completed ? ChartNoAxesColumn : Play;
  return (
    <div className="group/row relative -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center text-sm [&:hover:not(:has(.trash-btn:hover))]:bg-black/5 dark:[&:hover:not(:has(.trash-btn:hover))]:bg-white/10">
      <Link
        {...destination}
        aria-label={
          completed
            ? `View Standings for game with ${playerSummary}`
            : `Continue game with ${playerSummary}`
        }
        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 pl-3 pr-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current"
      >
        <PlayerAvatarStack players={game.players} />
        <span className="ml-1 shrink-0 whitespace-nowrap text-text-secondary">
          {formatRelativeTime(game.lastActivityAt)}
        </span>
        <Icon
          aria-hidden
          className={[
            "ml-2 h-4 w-4 shrink-0 fill-none text-text-secondary",
            completed
              ? "group-hover/row:text-pt-green-500"
              : "group-hover/row:fill-pt-blue-500 group-hover/row:text-pt-blue-500",
            "group-has-[.trash-btn:hover]/row:fill-none group-has-[.trash-btn:hover]/row:text-text-secondary",
          ].join(" ")}
        />
      </Link>
      <Button
        type="button"
        className="group/trash trash-btn mx-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:bg-black/5 hover:text-pt-red-500! dark:hover:bg-white/10"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label={`Delete game with ${playerSummary}`}
      >
        <Trash aria-hidden className="h-4 w-4 shrink-0 fill-none group-hover/trash:fill-current" />
      </Button>
    </div>
  );
}

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
