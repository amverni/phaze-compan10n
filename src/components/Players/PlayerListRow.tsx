import { Button } from "@headlessui/react";
import { Pencil, Star, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useDeletePlayer, useUpdatePlayer } from "../../data/hooks/usePlayers";
import type { Player } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { FavoriteAccent } from "../ui";

export interface PlayerListRowProps {
  player: Player;
  onEdit?: (player: Player) => void;
}

export function PlayerListRow({ player, onEdit }: PlayerListRowProps) {
  const deletePlayer = useDeletePlayer();
  const updatePlayer = useUpdatePlayer();
  const [isFavorite, setIsFavorite] = useState(player.isFavorite);

  useEffect(() => {
    setIsFavorite(player.isFavorite);
  }, [player.isFavorite]);

  function handleToggleFavorite() {
    const previousFavorite = isFavorite;
    const nextFavorite = previousFavorite ? 0 : 1;
    setIsFavorite(nextFavorite);

    updatePlayer.mutate(
      {
        id: player.id,
        updates: { isFavorite: nextFavorite },
      },
      {
        onError: () => setIsFavorite(previousFavorite),
      },
    );
  }

  return (
    <div className="group/row relative -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center text-sm [&:hover:not(:has(.trash-btn:hover,.favorite-btn:hover))]:bg-black/5 dark:[&:hover:not(:has(.trash-btn:hover,.favorite-btn:hover))]:bg-white/10">
      <FavoriteAccent active={isFavorite === 1} />
      <Button
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 h-full text-left"
        onClick={() => onEdit?.(player)}
      >
        <PlayerAvatar color={player.color} />
        <span className="flex-1 truncate">{player.name}</span>
        <Pencil className="h-4 w-4 shrink-0 fill-none text-text-secondary group-hover/row:fill-blue-500 group-hover/row:text-blue-500 group-has-[.trash-btn:hover]/row:fill-none group-has-[.trash-btn:hover]/row:text-text-secondary group-has-[.favorite-btn:hover]/row:fill-none group-has-[.favorite-btn:hover]/row:text-text-secondary" />
      </Button>
      <Button
        className="favorite-btn mx-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:text-amber-400! hover:bg-black/5 dark:hover:bg-white/20"
        onClick={handleToggleFavorite}
        aria-label={`${isFavorite ? "Remove" : "Add"} ${player.name} ${
          isFavorite ? "from" : "to"
        } favorites`}
      >
        <Star className={isFavorite ? "h-4 w-4 shrink-0 fill-current" : "h-4 w-4 shrink-0"} />
      </Button>
      <Button
        className="group/trash trash-btn mx-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:text-red-500! hover:bg-black/5 dark:hover:bg-white/20"
        onClick={() => deletePlayer.mutate(player.id)}
        aria-label={`Delete ${player.name}`}
      >
        <Trash className="h-4 w-4 shrink-0 fill-none group-hover/trash:fill-current" />
      </Button>
    </div>
  );
}
