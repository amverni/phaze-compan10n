import type { PlayerIdentity } from "../../../types";
import { PlayerAvatar } from "../../PlayerAvatar/PlayerAvatar";

/** Displays a single player row. */
export function PlayerRow({ player }: { player: PlayerIdentity }) {
  return (
    <span className="flex items-center gap-2">
      <PlayerAvatar player={player} />
      {player.name}
    </span>
  );
}
