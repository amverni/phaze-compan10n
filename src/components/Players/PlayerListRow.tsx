import { Button } from "@headlessui/react";
import { Pencil, Trash2 } from "lucide-react";
import { useDeletePlayer } from "../../data/hooks/usePlayers";
import type { Player } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";

export interface PlayerListRowProps {
  player: Player;
  onEdit?: (player: Player) => void;
}

export function PlayerListRow({ player, onEdit }: PlayerListRowProps) {
  const deletePlayer = useDeletePlayer();

  return (
    <div className="group/row -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center text-sm [&:hover:not(:has(.trash-btn:hover))]:bg-black/5 dark:[&:hover:not(:has(.trash-btn:hover))]:bg-white/10">
      <Button
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 h-full text-left"
        onClick={() => onEdit?.(player)}
      >
        <PlayerAvatar color={player.color} />
        <span className="flex-1 truncate">{player.name}</span>
        <Pencil className="h-4 w-4 shrink-0 text-text-secondary group-hover/row:text-blue-500 group-has-[.trash-btn:hover]/row:text-text-secondary" />
      </Button>
      <Button
        className="trash-btn mx-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-text-secondary group-hover/row:text-text-secondary/30 hover:!text-red-500 hover:bg-black/5 dark:hover:bg-white/20"
        onClick={() => deletePlayer.mutate(player.id)}
        aria-label={`Delete ${player.name}`}
      >
        <Trash2 className="h-4 w-4 shrink-0" />
      </Button>
    </div>
  );
}
