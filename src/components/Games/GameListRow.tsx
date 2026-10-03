import { Link, type LinkOptions } from "@tanstack/react-router";
import { ChartNoAxesColumn, Play, Trash } from "lucide-react";
import type { GameListItem } from "../../types";
import { formatRelativeTime } from "../../utils";
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
  const gameSummary = game.name
    ? `game "${game.name}" with ${playerSummary}`
    : `game with ${playerSummary}`;
  const completed = game.status === "completed";
  const Icon = completed ? ChartNoAxesColumn : Play;
  return (
    <div className="group/row relative -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center text-sm [&:hover:not(:has(.trash-btn:hover))]:bg-black/5 dark:[&:hover:not(:has(.trash-btn:hover))]:bg-white/10">
      <Link
        {...destination}
        aria-label={completed ? `View Standings for ${gameSummary}` : `Continue ${gameSummary}`}
        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 pl-3 pr-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current"
      >
        {game.name ? (
          <div className="flex min-w-0 flex-1 items-center">
            <span className="max-w-full shrink-0 truncate pr-2">{game.name}</span>
            <PlayerAvatarStack players={game.players} allowEmpty />
          </div>
        ) : (
          <PlayerAvatarStack players={game.players} />
        )}
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
        variant="plain"
        className="group/trash trash-btn mx-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:bg-black/5 hover:text-pt-red-500! dark:hover:bg-white/10"
        onClick={onDelete}
        disabled={isDeleting}
        aria-label={`Delete ${gameSummary}`}
      >
        <Trash aria-hidden className="h-4 w-4 shrink-0 fill-none group-hover/trash:fill-current" />
      </Button>
    </div>
  );
}
