import { Check } from "lucide-react";
import type { PhaseGraphSeries, StandingsRow } from "../../types";
import { getPlayerAvatarBoxSize, PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { formatPhaseProgressLabel, getPhaseGraphView, type PhaseGraphView } from "./phaseGraphView";

const LATEST_AVATAR_ICON_SIZE = 16;
const LATEST_AVATAR_BOX_SIZE = getPlayerAvatarBoxSize(LATEST_AVATAR_ICON_SIZE);
const LATEST_AVATAR_RADIUS = LATEST_AVATAR_BOX_SIZE / 2;
const LATEST_AVATAR_OVERLAP = 6;

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
    <div className="glass flex h-full min-h-0 flex-col rounded-2xl p-3">
      <PhaseGraphAccessibleTable view={view} />
      <div className="relative min-h-0 flex-1">
        <svg
          role="img"
          aria-label="Phase progress by round"
          viewBox={`0 0 ${view.width} ${view.height}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
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
              {label.label && (
                <text
                  x={8}
                  y={label.y + 4}
                  fill="var(--color-text-secondary)"
                  fontSize={11}
                  fontWeight={500}
                >
                  {label.label}
                </text>
              )}
              {label.isFinished && (
                <Check
                  x={chartStartX - 12}
                  y={label.y - 7}
                  width={13}
                  height={13}
                  color="var(--color-pt-green-500)"
                  aria-hidden
                />
              )}
            </g>
          ))}

          {view.series.map((graphSeries) => (
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

          {view.roundLabels.map((label) => (
            <line
              key={`tick-${label.roundNumber}`}
              data-round-tick={label.roundNumber}
              x1={label.x}
              x2={label.x}
              y1={view.height - 34}
              y2={view.height - 28}
              stroke="var(--color-text-secondary)"
              strokeOpacity={0.32}
            />
          ))}

          {view.roundLabels
            .filter((label) => label.showLabel)
            .map((label) => (
              <text
                key={label.roundNumber}
                x={label.x}
                y={view.height - 14}
                fill="var(--color-text-secondary)"
                fontSize={11}
                fontWeight={600}
                textAnchor="middle"
              >
                {label.label}
              </text>
            ))}
        </svg>

        {view.latestEndpointGroups.map((group) => (
          <div
            key={group.key}
            role="img"
            aria-label={`Latest ${group.label}: ${group.players
              .map((player) => player.name)
              .join(", ")}`}
            className="absolute flex"
            style={{
              left: getEndpointGroupPosition(
                (group.x / view.width) * 100,
                getEndpointGroupWidth(group.players.length),
              ),
              ...getEndpointGroupBlockPosition((group.y / view.height) * 100),
              maxWidth: "100%",
              flexWrap: "wrap",
              rowGap: 2,
              boxSizing: "border-box",
              paddingLeft: LATEST_AVATAR_OVERLAP,
            }}
          >
            {group.players.map((player, index) => (
              <span
                key={player.id}
                className="inline-flex rounded-full ring-2 ring-text-primary/75"
                style={{ marginLeft: index === 0 ? undefined : -LATEST_AVATAR_OVERLAP }}
              >
                <PlayerAvatar player={player} size={LATEST_AVATAR_ICON_SIZE} variant="icon" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function getEndpointGroupPosition(anchorPercent: number, groupSize: number): string {
  return `clamp(0px, calc(${anchorPercent}% - ${LATEST_AVATAR_RADIUS}px), calc(100% - ${groupSize}px))`;
}

function getEndpointGroupBlockPosition(anchorPercent: number) {
  if (anchorPercent <= 50) {
    return { top: getEndpointGroupPosition(anchorPercent, LATEST_AVATAR_BOX_SIZE) };
  }

  return { bottom: getEndpointGroupPosition(100 - anchorPercent, LATEST_AVATAR_BOX_SIZE) };
}

function getEndpointGroupWidth(playerCount: number): number {
  return (
    LATEST_AVATAR_OVERLAP +
    LATEST_AVATAR_BOX_SIZE +
    Math.max(playerCount - 1, 0) * (LATEST_AVATAR_BOX_SIZE - LATEST_AVATAR_OVERLAP)
  );
}

function PhaseGraphAccessibleTable({ view }: { view: PhaseGraphView }) {
  return (
    <div className="sr-only">
      <h3>Phase progress details</h3>
      <table>
        <caption>Phase progress details</caption>
        <thead>
          <tr>
            <th scope="col">Player</th>
            {view.roundLabels.map((label) => (
              <th key={label.roundNumber} scope="col">
                {label.roundNumber === 0 ? "Start" : `Round ${label.roundNumber}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.series.map((graphSeries) => (
            <tr key={graphSeries.player.id}>
              <th scope="row">{graphSeries.player.name}</th>
              {graphSeries.linePoints.map((point) => (
                <td key={point.roundNumber}>{formatPhaseProgressLabel(point, "sentence")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
