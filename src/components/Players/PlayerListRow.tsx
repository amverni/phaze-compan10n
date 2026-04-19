import { Button } from "@headlessui/react";
import { Pencil } from "lucide-react";
import type { Player } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";

export interface PlayerListRowProps {
  player: Player;
}

export function PlayerListRow({ player }: PlayerListRowProps) {
  return (
    <Button
      className="-mx-3 flex h-full w-[calc(100%+1.5rem)] cursor-pointer items-center justify-between px-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
      onClick={() => {}}
    >
      <span className="flex items-center gap-2">
        <PlayerAvatar color={player.color} />
        {player.name}
      </span>
      <Pencil className="h-4 w-4 shrink-0 text-text-secondary" />
    </Button>
  );
}
