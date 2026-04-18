import type { Player } from "../../../types";
import { PlayerAvatar } from "../../PlayerAvatar/PlayerAvatar";

/** Displays a single player row. */
export function PlayerRow({ player }: { player: Player }) {
  return (
    <span className="flex items-center gap-2">
      <PlayerAvatar color={player.color} />
      {player.name}
    </span>
  );
}
