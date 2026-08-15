import { Check } from "lucide-react";
import type { PhaseGraphSeries, StandingsRow } from "../../types";
import { GraphAccessibleTable } from "./GraphAccessibleTable";
import { GraphEndpointAvatarGroup } from "./GraphEndpointAvatarGroup";
import { GraphAxisLabels, GraphRoundAxis, GraphSeriesPaths } from "./GraphPlot";
import { graphContentClasses, graphShellClasses, graphSvgClasses } from "./graphLayout";
import { formatPhaseProgressLabel, getPhaseGraphView } from "./phaseGraphView";

const PHASE_AXIS_LABEL_X = 12;
const FINISHED_CHECK_SIZE = 13;

export interface PhaseGraphProps {
  series: readonly PhaseGraphSeries[];
  rows: readonly StandingsRow[];
  totalPhases: number;
}

export function PhaseGraph({ series, rows, totalPhases }: PhaseGraphProps) {
  const view = getPhaseGraphView({ series, rows, totalPhases });
  const chartStartX = view.roundLabels[0]?.x ?? 0;
  const chartEndX = view.roundLabels.at(-1)?.x ?? view.width;

  if (series.length === 0) {
    return (
      <div className="glass flex h-full items-center justify-center rounded-2xl px-6 text-center text-sm text-text-secondary">
        No phase progress to show yet.
      </div>
    );
  }

  return (
    <div className={graphShellClasses}>
      <GraphAccessibleTable
        title="Phase progress details"
        roundLabels={view.roundLabels}
        series={view.series}
        formatPoint={(point) => formatPhaseProgressLabel(point, "sentence")}
      />
      <div className={graphContentClasses}>
        <svg
          role="img"
          aria-label="Phase progress by round"
          viewBox={`0 0 ${view.width} ${view.height}`}
          preserveAspectRatio="none"
          className={graphSvgClasses}
        >
          {view.phaseLabels.map((label) => (
            <g key={label.value}>
              <line
                x1={chartStartX}
                x2={chartEndX}
                y1={label.y}
                y2={label.y}
                stroke="var(--color-text-secondary)"
                strokeOpacity={0.16}
                strokeDasharray={label.isFinished ? "4 5" : undefined}
              />
              {label.isFinished && (
                <Check
                  x={PHASE_AXIS_LABEL_X - FINISHED_CHECK_SIZE / 2}
                  y={label.y - FINISHED_CHECK_SIZE / 2}
                  width={FINISHED_CHECK_SIZE}
                  height={FINISHED_CHECK_SIZE}
                  color="var(--color-pt-green-500)"
                  aria-hidden
                />
              )}
            </g>
          ))}

          <GraphSeriesPaths series={view.series} />
          <GraphRoundAxis roundLabels={view.roundLabels} height={view.height} />
        </svg>

        <GraphAxisLabels
          graphWidth={view.width}
          graphHeight={view.height}
          labels={[
            ...view.phaseLabels
              .filter((label) => label.label)
              .map((label) => ({
                key: `phase-${label.value}`,
                label: label.label ?? "",
                x: PHASE_AXIS_LABEL_X,
                y: label.y,
                anchor: "middle" as const,
              })),
            ...view.roundLabels
              .filter((label) => label.showLabel && label.label)
              .map((label) => ({
                key: `round-${label.roundNumber}`,
                label: label.label ?? "",
                x: label.x,
                y: view.height - 14,
                anchor: "middle" as const,
              })),
          ]}
        />

        {view.latestEndpointGroups.map((group) => (
          <GraphEndpointAvatarGroup
            key={group.key}
            label={group.label}
            players={group.players}
            x={group.x}
            y={group.y}
            graphWidth={view.width}
            graphHeight={view.height}
          />
        ))}
      </div>
    </div>
  );
}
