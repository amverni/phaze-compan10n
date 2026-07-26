import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { deriveStandings } from "../../data/api/standings";
import { PhaseGraph } from "./PhaseGraph";
import {
  makePhaseGraphGame,
  makePhaseGraphRound,
  makePhaseGraphSeries,
  phaseGraphPlayers,
} from "./phaseGraphTestFixtures";

describe("PhaseGraph", () => {
  it("renders a custom SVG graph with player-colored lines and uncapped latest avatar groups", () => {
    const game = makePhaseGraphGame();
    const standings = deriveStandings({
      game,
      players: [phaseGraphPlayers.amy, phaseGraphPlayers.bob, phaseGraphPlayers.cam],
      rounds: [
        makePhaseGraphRound(1, phaseGraphPlayers.cam.id, [
          {
            playerId: phaseGraphPlayers.amy.id,
            currentPhase: 1,
            phaseStatus: "completed",
            score: 3,
          },
          {
            playerId: phaseGraphPlayers.bob.id,
            currentPhase: 1,
            phaseStatus: "completed",
            score: 1,
          },
          {
            playerId: phaseGraphPlayers.cam.id,
            currentPhase: 1,
            phaseStatus: "completed",
            score: 1,
          },
        ]),
      ],
    });

    const markup = renderToStaticMarkup(
      <PhaseGraph
        series={standings.phaseGraphSeries}
        rows={standings.rows}
        totalPhases={game.phaseSet.phases.length}
      />,
    );

    expect(markup).toContain('aria-label="Phase progress by round"');
    expect(markup).toContain("<svg");
    expect(markup).toContain('stroke="#df0e88"');
    expect(markup).toContain('stroke="#1D4ED8"');
    expect(markup).toContain('d="M 64 180 L 296 128"');
    expect(markup).toContain("Start");
    expect(markup).toContain("Phase 3");
    expect(markup).toContain("Phase progress details");
    expect(markup).toContain("<table");
    expect(markup).toContain('aria-label="Latest phase 2: Cam, Bob, Amy"');
    expect(markup).toContain("ring-text-primary/75");
    expect(markup).not.toContain("ring-white");
    expect(markup).not.toContain("+");
  });

  it("renders every saved Round as an x-axis tick while keeping dense text labels sparse", () => {
    const markup = renderToStaticMarkup(
      <PhaseGraph rows={[]} totalPhases={3} series={[makePhaseGraphSeries(13)]} />,
    );

    expect(markup.match(/data-round-tick=/g)).toHaveLength(13);
    expect(markup).toContain(">12</text>");
  });

  it("renders the graph fitted to its panel instead of inside a scroll region", () => {
    const markup = renderToStaticMarkup(
      <PhaseGraph rows={[]} totalPhases={3} series={[makePhaseGraphSeries(25)]} />,
    );

    expect(markup.match(/data-round-tick=/g)).toHaveLength(25);
    expect(markup).not.toContain("Scrollable phase graph");
    expect(markup).not.toContain("overflow-x-auto");
    expect(markup).not.toContain("overflow-y-auto");
    expect(markup).not.toContain("overflow-y-hidden");
    expect(markup).not.toContain("data-swipe-navigation-ignore");
    expect(markup).toContain('class="absolute inset-0 h-full w-full"');
  });

  it("keeps uncapped latest avatar groups inside the graph bounds", () => {
    const markup = renderTiedEndpointGroup(8, {
      currentPhase: 3,
      isFinished: true,
      standingValue: 4,
    });

    expect(markup).toContain("Player 8");
    expect(markup).toContain(
      "left:clamp(0px, calc(82.22222222222221% - 13px), calc(100% - 172px))",
    );
    expect(markup).toContain("top:clamp(0px, calc(10.714285714285714% - 13px), calc(100% - 26px))");
  });

  it("wraps latest avatar groups that are wider than the graph panel", () => {
    const markup = renderTiedEndpointGroup(20, {
      currentPhase: 1,
      isFinished: false,
      standingValue: 1,
    });

    expect(markup).toContain("Player 20");
    expect(markup).toContain("max-width:100%");
    expect(markup).toContain("flex-wrap:wrap");
    expect(markup).toContain(
      "bottom:clamp(0px, calc(19.64285714285714% - 13px), calc(100% - 26px))",
    );
  });

  it("announces Finished Players by final phase instead of the standing value above the graph", () => {
    const markup = renderToStaticMarkup(
      <PhaseGraph
        rows={[]}
        totalPhases={3}
        series={[
          {
            player: phaseGraphPlayers.amy,
            points: [
              { roundNumber: 0, currentPhase: 1, isFinished: false, standingValue: 1 },
              { roundNumber: 1, currentPhase: 3, isFinished: true, standingValue: 4 },
            ],
          },
        ]}
      />,
    );

    expect(markup).toContain('aria-label="Latest finished phase 3: Amy"');
    expect(markup).toContain("Finished phase 3");
    expect(markup).not.toContain('aria-label="Latest phase 4: Amy"');
  });
});

function renderTiedEndpointGroup(
  playerCount: number,
  latestPoint: { currentPhase: number; isFinished: boolean; standingValue: number },
) {
  const tiedPlayers = Array.from({ length: playerCount }, (_, index) => ({
    ...phaseGraphPlayers.amy,
    id: `player-${index}`,
    name: `Player ${index + 1}`,
    createdAt: index,
  }));

  return renderToStaticMarkup(
    <PhaseGraph
      rows={[]}
      totalPhases={3}
      series={tiedPlayers.map((player) => ({
        player,
        points: [
          { roundNumber: 0, currentPhase: 1, isFinished: false, standingValue: 1 },
          { roundNumber: 12, ...latestPoint },
        ],
      }))}
    />,
  );
}
