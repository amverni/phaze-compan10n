import { getColorEntry } from "../../data/constants/colors";
import type { PhaseGraphPoint, PhaseGraphSeries, Player, StandingsRow } from "../../types";

const GRAPH_LEFT = 48;
const GRAPH_TOP = 24;
const GRAPH_BOTTOM = 44;
const ROUND_SPACING = 72;
const PHASE_SPACING = 52;
const MIN_GRAPH_WIDTH = 240;
const DEFAULT_VISIBLE_WIDTH = 520;

export interface PhaseGraphViewInput {
  series: readonly PhaseGraphSeries[];
  totalPhases: number;
  rows?: readonly StandingsRow[];
}

export interface PhaseGraphView {
  width: number;
  height: number;
  defaultScrollLeft: number;
  roundLabels: RoundLabel[];
  phaseLabels: PhaseLabel[];
  series: PhaseGraphViewSeries[];
  latestEndpointGroups: LatestPhaseEndpointGroup[];
}

export interface RoundLabel {
  roundNumber: number;
  label: string;
  x: number;
}

export interface PhaseLabel {
  value: number;
  label: string;
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
  const roundNumbers = getRoundNumbers(series);
  const roundXByNumber = new Map(
    roundNumbers.map((roundNumber, index) => [roundNumber, GRAPH_LEFT + index * ROUND_SPACING]),
  );
  const height = GRAPH_TOP + (maxStandingValue - 1) * PHASE_SPACING + GRAPH_BOTTOM;
  const width = Math.max(
    MIN_GRAPH_WIDTH,
    GRAPH_LEFT + Math.max(roundNumbers.length - 1, 0) * ROUND_SPACING,
  );
  const rowOrder = new Map(rows.map((row, index) => [row.player.id, index]));
  const viewSeries = series.map((graphSeries) => {
    const linePoints = graphSeries.points.map((point) => ({
      ...point,
      x: roundXByNumber.get(point.roundNumber) ?? GRAPH_LEFT,
      y: getY(point.standingValue, maxStandingValue),
    }));

    return {
      player: graphSeries.player,
      color: getPlayerLineColor(graphSeries.player),
      linePoints,
      path: linePoints.map(({ x, y }, index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" "),
    };
  });

  return {
    width,
    height,
    defaultScrollLeft: Math.max(0, width - DEFAULT_VISIBLE_WIDTH),
    roundLabels: roundNumbers.map((roundNumber) => ({
      roundNumber,
      label: roundNumber === 0 ? "Start" : String(roundNumber),
      x: roundXByNumber.get(roundNumber) ?? GRAPH_LEFT,
    })),
    phaseLabels: Array.from({ length: maxStandingValue }, (_, index) => {
      const value = maxStandingValue - index;
      return {
        value,
        label: `Ph ${Math.min(value, totalPhases)}`,
        isFinished: value > totalPhases,
        y: getY(value, maxStandingValue),
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

function getY(standingValue: number, maxStandingValue: number): number {
  return GRAPH_TOP + (maxStandingValue - standingValue) * PHASE_SPACING;
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
