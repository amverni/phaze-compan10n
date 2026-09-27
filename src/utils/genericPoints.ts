export function parseGenericPoints(
  value: string,
  metric: "Points" | "Tiebreaker" = "Points",
): number {
  if (typeof value !== "string" || value.trim() !== value || !/^[+-]?\d+$/.test(value)) {
    throw new Error(`Enter a whole number for ${metric}.`);
  }
  const points = Number(BigInt(value));
  if (!Number.isSafeInteger(points)) {
    throw new Error(`${metric} must be between -9007199254740991 and 9007199254740991.`);
  }
  return points;
}
