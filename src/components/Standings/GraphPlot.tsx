import type { Player } from "../../types";

interface GraphPlotSeries {
  player: Pick<Player, "id">;
  color: string;
  path: string;
}

interface GraphRoundLabel {
  roundNumber: number;
  label: string | null;
  showLabel: boolean;
  x: number;
}

interface GraphSeriesPathsProps {
  series: readonly GraphPlotSeries[];
}

interface GraphRoundAxisProps {
  roundLabels: readonly GraphRoundLabel[];
  height: number;
}

export function GraphSeriesPaths({ series }: GraphSeriesPathsProps) {
  return (
    <>
      {series.map((graphSeries) => (
        <path
          key={graphSeries.player.id}
          d={graphSeries.path}
          fill="none"
          stroke={graphSeries.color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}

export function GraphRoundAxis({ roundLabels, height }: GraphRoundAxisProps) {
  return (
    <>
      {roundLabels.map((label) => (
        <line
          key={`tick-${label.roundNumber}`}
          data-round-tick={label.roundNumber}
          x1={label.x}
          x2={label.x}
          y1={height - 34}
          y2={height - 28}
          stroke="var(--color-text-secondary)"
          strokeOpacity={0.32}
        />
      ))}

      {roundLabels
        .filter((label) => label.showLabel)
        .map((label) => (
          <text
            key={label.roundNumber}
            x={label.x}
            y={height - 14}
            fill="var(--color-text-secondary)"
            fontSize={11}
            fontWeight={600}
            textAnchor="middle"
          >
            {label.label}
          </text>
        ))}
    </>
  );
}
