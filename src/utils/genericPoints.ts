export function parseGenericPoints(value: string): number {
  if (typeof value !== "string" || value.trim() !== value || !/^[+-]?\d+$/.test(value)) {
    throw new Error("Enter a whole number for Points.");
  }
  const points = Number(BigInt(value));
  if (!Number.isSafeInteger(points)) {
    throw new Error("Points must be between -9007199254740991 and 9007199254740991.");
  }
  return points;
}
