import type { Player } from "../../../types";

/** Displays a single player in the game list. Will be expanded later. */
export function PlayerRow({ player }: { player: Player }) {
  return player.name;
}
