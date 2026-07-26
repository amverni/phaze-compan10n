import type { GameTiebreaker, Round, TiebreakerGraphSeries } from "../../types";
import { formatTiebreakerValue } from "../../utils";
import { GraphAccessibleTable } from "./GraphAccessibleTable";
import { GraphEndpointAvatarGroup } from "./GraphEndpointAvatarGroup";
import { GraphRoundAxis, GraphSeriesPaths } from "./GraphPlot";
import { graphContentClasses, graphShellClasses, graphSvgClasses } from "./graphLayout";
import { getTiebreakerGraphView } from "./tiebreakerGraphView";

export interface TiebreakerGraphProps {
  series: readonly TiebreakerGraphSeries[];
  tiebreaker: GameTiebreaker;
  rounds: readonly Round[];
}

export function TiebreakerGraph({ series, tiebreaker, rounds }: TiebreakerGraphProps) {
  const view = getTiebreakerGraphView({ series, tiebreaker, rounds });
  const chartStartX = view.roundLabels[0]?.x ?? 0;
  const chartEndX = view.roundLabels.at(-1)?.x ?? view.width;

  if (series.length === 0) {
    return (
      <div className="glass flex h-full items-center justify-center rounded-2xl px-6 text-center text-sm text-text-secondary">
        No Tiebreaker progress to show yet.
      </div>
    );
  }

  return (
    <div className={graphShellClasses}>
      <GraphAccessibleTable
        title="Tiebreaker progress details"
        roundLabels={view.roundLabels}
        series={view.series}
        formatPoint={(point) => formatTiebreakerValue(point.value, tiebreaker)}
      />
      <div className={graphContentClasses}>
        <svg
          role="img"
          aria-label="Tiebreaker progress by round"
          viewBox={`0 0 ${view.width} ${view.height}`}
          preserveAspectRatio="none"
          className={graphSvgClasses}
        >
          {view.valueLabels.map((label) => (
            <g key={`${label.value}-${label.y}`}>
              <line
                x1={chartStartX}
                x2={chartEndX}
                y1={label.y}
                y2={label.y}
                stroke="var(--color-text-secondary)"
                strokeOpacity={0.16}
              />
              <text
                x={8}
                y={label.y + 4}
                fill="var(--color-text-secondary)"
                fontSize={11}
                fontWeight={500}
              >
                {label.label}
              </text>
            </g>
          ))}

          <GraphSeriesPaths series={view.series} />
          <GraphRoundAxis roundLabels={view.roundLabels} height={view.height} />
        </svg>

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
