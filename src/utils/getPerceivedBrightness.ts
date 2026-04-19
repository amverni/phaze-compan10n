/** Perceived brightness (0–255) using the standard luminance formula. */
function getPerceivedBrightness(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return r * 0.299 + g * 0.587 + b * 0.114;
}

/** Returns black or white, whichever has better contrast against the given hex color. */
export function getContrastColor(hex: string): "#000000" | "#ffffff" {
  return getPerceivedBrightness(hex) > 150 ? "#000000" : "#ffffff";
}
