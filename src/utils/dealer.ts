import type { PlayerId } from "../types";

/** Round 1 starts with the first Player; rotation wraps through the supplied order. */
export function getDealerId(roundNumber: number, playerIds: readonly PlayerId[]): PlayerId | null {
  if (playerIds.length === 0) return null;
  const index = (((roundNumber - 1) % playerIds.length) + playerIds.length) % playerIds.length;
  return playerIds[index];
}
