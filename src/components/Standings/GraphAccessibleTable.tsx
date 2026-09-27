import type { PlayerIdentity } from "../../types";

interface GraphRoundLabel {
  roundNumber: number;
}

interface GraphTableSeries<TPoint extends { roundNumber: number }> {
  player: Pick<PlayerIdentity, "id" | "name">;
  linePoints: readonly TPoint[];
}

interface GraphAccessibleTableProps<TPoint extends { roundNumber: number }> {
  title: string;
  roundLabels: readonly GraphRoundLabel[];
  series: readonly GraphTableSeries<TPoint>[];
  formatPoint: (point: TPoint) => string;
}

export function GraphAccessibleTable<TPoint extends { roundNumber: number }>({
  title,
  roundLabels,
  series,
  formatPoint,
}: GraphAccessibleTableProps<TPoint>) {
  return (
    <div className="sr-only">
      <h3>{title}</h3>
      <table>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Player</th>
            {roundLabels.map((label) => (
              <th key={label.roundNumber} scope="col">
                {label.roundNumber === 0 ? "Start" : `Round ${label.roundNumber}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((graphSeries) => (
            <tr key={graphSeries.player.id}>
              <th scope="row">{graphSeries.player.name}</th>
              {graphSeries.linePoints.map((point) => (
                <td key={point.roundNumber}>{formatPoint(point)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
