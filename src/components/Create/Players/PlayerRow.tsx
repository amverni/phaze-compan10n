import type { Player } from "../../../types";

/** Displays a single player row. */
export function PlayerRow({ player }: { player: Player }) {
  return player.name;
}
