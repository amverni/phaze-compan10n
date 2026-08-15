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

interface GraphAxisLabelsProps {
  labels: readonly GraphAxisLabel[];
  graphWidth: number;
  graphHeight: number;
}

export interface GraphAxisLabel {
  key: string;
  label: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
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
    </>
  );
}

export function GraphAxisLabels({ labels, graphWidth, graphHeight }: GraphAxisLabelsProps) {
  return (
    <>
      {labels.map((label) => (
        <span
          key={label.key}
          className={[
            "pointer-events-none",
            "absolute",
            label.anchor === "middle" ? "-translate-x-1/2" : "",
            label.anchor === "end" ? "-translate-x-full text-right" : "",
            "-translate-y-1/2",
            "text-sm",
            "font-medium",
            "text-text-secondary",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden="true"
          style={{
            left: `${(label.x / graphWidth) * 100}%`,
            top: `${(label.y / graphHeight) * 100}%`,
          }}
        >
          {label.label}
        </span>
      ))}
    </>
  );
}
