import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import type { PhaseGraphSeries, StandingsRow } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { getPhaseGraphView } from "./phaseGraphView";

export interface PhaseGraphProps {
  series: readonly PhaseGraphSeries[];
  rows: readonly StandingsRow[];
  totalPhases: number;
}

export function PhaseGraph({ series, rows, totalPhases }: PhaseGraphProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const view = getPhaseGraphView({ series, rows, totalPhases });
  const graphWidth = view.width;
  const chartStartX = view.roundLabels[0]?.x ?? 0;
  const chartEndX = view.roundLabels.at(-1)?.x ?? graphWidth;

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement && graphWidth > 0) {
      scrollElement.scrollLeft = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth);
    }
  }, [graphWidth]);

  if (series.length === 0) {
    return (
      <div className="glass flex h-full items-center justify-center rounded-2xl px-6 text-center text-sm text-text-secondary">
        No phase progress to show yet.
      </div>
    );
  }

  return (
    <div className="glass h-full rounded-2xl p-3">
      <section
        ref={scrollRef}
        className="h-full overflow-x-auto overflow-y-hidden"
        data-swipe-navigation-ignore=""
        aria-label="Scrollable phase graph"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the horizontal graph needs keyboard focus to scroll.
        tabIndex={0}
      >
        <div className="relative" style={{ width: graphWidth, height: view.height }}>
          <svg
            role="img"
            aria-label="Phase progress by round"
            viewBox={`0 0 ${graphWidth} ${view.height}`}
            className="absolute inset-0 h-full"
            style={{ width: graphWidth }}
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
                <text
                  x={8}
                  y={label.y + 4}
                  fill="var(--color-text-secondary)"
                  fontSize={11}
                  fontWeight={label.isFinished ? 700 : 500}
                >
                  {label.label}
                </text>
                {label.isFinished && (
                  <Check
                    x={35}
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
              aria-label={`Latest phase ${group.key}: ${group.players
                .map((player) => player.name)
                .join(", ")}`}
              className="absolute flex -space-x-1.5"
              style={{
                left: group.x,
                top: group.y,
                transform: "translate(-13px, -13px)",
              }}
            >
              {group.players.map((player) => (
                <span key={player.id} className="inline-flex rounded-full ring-2 ring-white/75">
                  <PlayerAvatar player={player} size={16} variant="icon" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
