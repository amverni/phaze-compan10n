import { Button } from "@headlessui/react";
import { Plus } from "lucide-react";
import type { Player } from "../../../types";

export interface AddPlayerRowProps {
  player: Player;
  onSelect: (player: Player) => void;
  disabled?: boolean;
}

/** A clickable player row that adds the player to the game. */
export function AddPlayerRow({ player, onSelect, disabled }: AddPlayerRowProps) {
  return (
    <Button
      className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
      onClick={() => onSelect(player)}
      disabled={disabled}
    >
      {player.name}
      <Plus className="h-5 w-5 shrink-0 text-text-secondary" />
    </Button>
  );
}
