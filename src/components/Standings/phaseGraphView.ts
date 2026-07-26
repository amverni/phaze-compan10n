import { getColorEntry } from "../../data/constants/colors";
import type { PhaseGraphPoint, PhaseGraphSeries, Player, StandingsRow } from "../../types";

const GRAPH_LEFT = 64;
const GRAPH_TOP = 24;
const GRAPH_BOTTOM = 44;
const GRAPH_RIGHT = 64;
const GRAPH_WIDTH = 360;
const CHART_WIDTH = GRAPH_WIDTH - GRAPH_LEFT - GRAPH_RIGHT;
const PHASE_SPACING = 52;
const MAX_GRAPH_HEIGHT = 320;
const MIN_ROUND_LABEL_SPACING = 24;

export interface PhaseGraphViewInput {
  series: readonly PhaseGraphSeries[];
  totalPhases: number;
  rows?: readonly StandingsRow[];
}

export interface PhaseGraphView {
  width: number;
  height: number;
  roundLabels: RoundLabel[];
  phaseLabels: PhaseLabel[];
  series: PhaseGraphViewSeries[];
  latestEndpointGroups: LatestPhaseEndpointGroup[];
}

export interface RoundLabel {
  roundNumber: number;
  label: string | null;
  showLabel: boolean;
  x: number;
}

export interface PhaseLabel {
  value: number;
  label: string | null;
  isFinished: boolean;
  y: number;
}

export interface PhaseGraphViewSeries {
  player: Player;
  color: string;
  linePoints: PositionedPhaseGraphPoint[];
  path: string;
}

export interface PositionedPhaseGraphPoint extends PhaseGraphPoint {
  x: number;
  y: number;
}

export interface LatestPhaseEndpointGroup {
  key: string;
  label: string;
  x: number;
  y: number;
  players: Player[];
}

export function getPhaseGraphView({
  series,
  totalPhases,
  rows = [],
}: PhaseGraphViewInput): PhaseGraphView {
  const maxStandingValue = totalPhases + 1;
  const phaseSpacing = getPhaseSpacing(totalPhases);
  const roundNumbers = getRoundNumbers(series);
  const roundLabelStride = getRoundLabelStride(roundNumbers.length);
  const roundXByNumber = getRoundXByNumber(roundNumbers);
  const height = GRAPH_TOP + (maxStandingValue - 1) * phaseSpacing + GRAPH_BOTTOM;
  const rowOrder = new Map(rows.map((row, index) => [row.player.id, index]));
  const viewSeries = series.map((graphSeries) => {
    const linePoints = graphSeries.points.map((point) => ({
      ...point,
      x: roundXByNumber.get(point.roundNumber) ?? GRAPH_LEFT,
      y: getY(point.standingValue, maxStandingValue, phaseSpacing),
    }));

    return {
      player: graphSeries.player,
      color: getPlayerLineColor(graphSeries.player),
      linePoints,
      path: linePoints.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" "),
    };
  });

  return {
    width: GRAPH_WIDTH,
    height,
    roundLabels: roundNumbers.map((roundNumber, index) => ({
      roundNumber,
      label: roundNumber === 0 ? null : String(roundNumber),
      showLabel: shouldShowRoundLabel(roundNumber, index, roundNumbers.length, roundLabelStride),
      x: roundXByNumber.get(roundNumber) ?? GRAPH_LEFT,
    })),
    phaseLabels: Array.from({ length: maxStandingValue }, (_, index) => {
      const value = maxStandingValue - index;
      return {
        value,
        label: value > totalPhases ? null : String(value),
        isFinished: value > totalPhases,
        y: getY(value, maxStandingValue, phaseSpacing),
      };
    }),
    series: viewSeries,
    latestEndpointGroups: getLatestEndpointGroups(viewSeries, rowOrder),
  };
}

function getRoundNumbers(series: readonly PhaseGraphSeries[]): number[] {
  return Array.from(
    new Set(series.flatMap((graphSeries) => graphSeries.points.map((point) => point.roundNumber))),
  ).sort((a, b) => a - b);
}

function getY(standingValue: number, maxStandingValue: number, phaseSpacing: number): number {
  return GRAPH_TOP + (maxStandingValue - standingValue) * phaseSpacing;
}

function getRoundXByNumber(roundNumbers: readonly number[]): ReadonlyMap<number, number> {
  const roundSpacing = roundNumbers.length > 1 ? CHART_WIDTH / (roundNumbers.length - 1) : 0;

  return new Map(
    roundNumbers.map((roundNumber, index) => [
      roundNumber,
      roundToTwoDecimals(GRAPH_LEFT + index * roundSpacing),
    ]),
  );
}

function roundToTwoDecimals(value: number): number {
  return Number(value.toFixed(2));
}

function getPhaseSpacing(totalPhases: number): number {
  const phaseSteps = Math.max(totalPhases, 1);
  const maxSpacing = Math.floor((MAX_GRAPH_HEIGHT - GRAPH_TOP - GRAPH_BOTTOM) / phaseSteps);
  return Math.min(PHASE_SPACING, maxSpacing);
}

function getRoundLabelStride(roundCount: number): number {
  if (roundCount <= 1) return 1;

  const roundSpacing = CHART_WIDTH / (roundCount - 1);
  return Math.max(1, Math.ceil(MIN_ROUND_LABEL_SPACING / roundSpacing));
}

function shouldShowRoundLabel(
  roundNumber: number,
  index: number,
  roundCount: number,
  stride: number,
): boolean {
  if (roundNumber === 0) return false;
  if (stride === 1) return true;

  return (roundCount - 1 - index) % stride === 0;
}

function getPlayerLineColor(player: Player): string {
  return getColorEntry(player.color)?.hex ?? player.color;
}

function getLatestEndpointGroups(
  series: readonly PhaseGraphViewSeries[],
  rowOrder: ReadonlyMap<string, number>,
): LatestPhaseEndpointGroup[] {
  const groups = new Map<string, LatestPhaseEndpointGroup>();

  for (const graphSeries of series) {
    const latestPoint = graphSeries.linePoints.at(-1);
    if (!latestPoint) continue;

    const key = String(latestPoint.standingValue);
    const group = groups.get(key);
    if (group) {
      group.players.push(graphSeries.player);
    } else {
      groups.set(key, {
        key,
        label: formatPhaseProgressLabel(latestPoint, "lower"),
        x: latestPoint.x,
        y: latestPoint.y,
        players: [graphSeries.player],
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      players: group.players
        .slice()
        .sort(
          (a, b) =>
            (rowOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
            (rowOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER),
        ),
    }))
    .sort((a, b) => a.y - b.y);
}

type PhaseProgressLabelCase = "lower" | "sentence";

export function formatPhaseProgressLabel(
  point: Pick<PhaseGraphPoint, "currentPhase" | "isFinished">,
  labelCase: PhaseProgressLabelCase,
): string {
  const label = point.isFinished
    ? `finished phase ${point.currentPhase}`
    : `phase ${point.currentPhase}`;
  return labelCase === "sentence" ? `${label[0]?.toUpperCase() ?? ""}${label.slice(1)}` : label;
}
