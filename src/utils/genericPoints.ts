export function editGenericPoints(value: string, key: string): string {
  if (key === "Delete") return "0";
  if (key === "Backspace") {
    const remaining = value.slice(0, -1);
    return remaining === "" || remaining === "-" ? "0" : remaining;
  }
  if (key === "-") {
    return value === "0" ? "0" : value.startsWith("-") ? value.slice(1) : `-${value}`;
  }
  if (key === "+") return value.replace(/^-/, "");
  // Retain invalid typed characters so a decimal such as "1.5" cannot become "15".
  return value === "0" ? key : value + key;
}

export function parseGenericPoints(
  value: string,
  metric: "Points" | "Tiebreaker" = "Points",
): number {
  if (typeof value !== "string" || value.trim() !== value || !/^[+-]?\d+$/.test(value)) {
    throw new Error(`Enter a whole number for ${metric}.`);
  }
  const points = Number(BigInt(value));
  if (!Number.isSafeInteger(points)) {
    throw new Error(`${metric} must be within +/-9007199254740991.`);
  }
  return points;
}
