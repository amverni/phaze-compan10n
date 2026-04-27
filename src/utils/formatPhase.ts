import type { Meld } from "../types";

/**
 * Format a single meld requirement into a human-readable string.
 *
 * @example formatMeld({ type: "set", count: 3, quantity: 2 }) → "2 sets of 3"
 * @example formatMeld({ type: "run", count: 8, quantity: 1 }) → "1 run of 8"
 * @example formatMeld({ type: "colorGroup", count: 7, quantity: 1 }) → "7 cards of the same color"
 * @example formatMeld({ type: "set", count: 5, isSameColor: true, quantity: 1 }) → "1 set of 5 of the same color"
 */
function formatMeld(meld: Meld): string {
  if (meld.type === "colorGroup") {
    return `${meld.count} cards of the same color`;
  }

  const plural = meld.quantity === 1 ? "" : "s";
  const colorText = meld.isSameColor ? " of the same color" : "";
  return `${meld.quantity} ${meld.type}${plural} of ${meld.count}${colorText}`;
}

/**
 * Format all meld requirements of a phase into a combined human-readable string.
 *
 * Joins melds with ", " and uses " and " before the last meld.
 *
 * @example formatPhaseRequirements([set3, run4]) → "1 set of 3 and 1 run of 4"
 * @example formatPhaseRequirements([set5, set3, run4]) → "1 set of 5, 1 set of 3, and 1 run of 4"
 * @example formatPhaseRequirements([set3]) → "2 sets of 3"
 */
export function formatPhaseRequirements(requirements: Meld[]): string {
  const parts = requirements.map(formatMeld);

  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;

  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}
