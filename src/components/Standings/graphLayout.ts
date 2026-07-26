import { getColorEntry } from "../../data/constants/colors";
import type { Player } from "../../types";

export const GRAPH_LEFT = 64;
export const GRAPH_TOP = 24;
export const GRAPH_BOTTOM = 44;
export const GRAPH_RIGHT = 64;
export const GRAPH_WIDTH = 360;
export const CHART_WIDTH = GRAPH_WIDTH - GRAPH_LEFT - GRAPH_RIGHT;
export const MIN_ROUND_LABEL_SPACING = 24;
export const graphShellClasses = ["glass", "flex h-full min-h-0 flex-col rounded-2xl p-3"].join(
  " ",
);
export const graphContentClasses = ["relative min-h-0 flex-1"].join(" ");
export const graphSvgClasses = ["absolute inset-0 h-full w-full"].join(" ");

export function getRoundNumbers<TPoint extends { roundNumber: number }>(
  series: readonly { points: readonly TPoint[] }[],
): number[] {
  return Array.from(
    new Set(series.flatMap((graphSeries) => graphSeries.points.map((point) => point.roundNumber))),
  ).sort((a, b) => a - b);
}

export function getRoundXByNumber(roundNumbers: readonly number[]): ReadonlyMap<number, number> {
  const roundSpacing = roundNumbers.length > 1 ? CHART_WIDTH / (roundNumbers.length - 1) : 0;

  return new Map(
    roundNumbers.map((roundNumber, index) => [
      roundNumber,
      roundToTwoDecimals(GRAPH_LEFT + index * roundSpacing),
    ]),
  );
}

export function getRoundLabelStride(roundCount: number): number {
  if (roundCount <= 1) return 1;

  const roundSpacing = CHART_WIDTH / (roundCount - 1);
  return Math.max(1, Math.ceil(MIN_ROUND_LABEL_SPACING / roundSpacing));
}

export function shouldShowRoundLabel(
  roundNumber: number,
  index: number,
  roundCount: number,
  stride: number,
): boolean {
  if (roundNumber === 0) return false;
  if (stride === 1) return true;

  return (roundCount - 1 - index) % stride === 0;
}

export function getGraphPlayerColor(player: Player): string {
  return getColorEntry(player.color)?.hex ?? player.color;
}

export function roundToTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}
