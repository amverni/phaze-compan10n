import { Button } from "@headlessui/react";
import { Plus } from "lucide-react";
import type { Player } from "../../../types";
import { PlayerAvatar } from "../../PlayerAvatar/PlayerAvatar";

export interface AddPlayerRowProps {
  player: Player;
  onSelect: (player: Player) => void;
  disabled?: boolean;
}

/** A clickable player row that adds the player to the game. */
export function AddPlayerRow({ player, onSelect, disabled }: AddPlayerRowProps) {
  return (
    <Button
      className="-mx-3 flex h-full w-[calc(100%+1.5rem)] cursor-pointer items-center justify-between px-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
      onClick={() => onSelect(player)}
      disabled={disabled}
    >
      <span className="flex items-center gap-2">
        <PlayerAvatar color={player.color} />
        {player.name}
      </span>
      <Plus className="h-5 w-5 shrink-0 text-text-secondary" />
    </Button>
  );
}
