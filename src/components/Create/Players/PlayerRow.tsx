import type { Player } from "../../../types";

/** Displays a single player row (non-interactive). */
export function PlayerRow({ player }: { player: Player }) {
  return player.name;
}
