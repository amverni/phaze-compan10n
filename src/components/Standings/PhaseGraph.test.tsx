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
    expect(markup).toContain('d="M 40 180 L 296 128"');
    expect(markup).not.toContain(">Start</text>");
    expect(markup).not.toContain(">Phase 3</text>");
    expect(markup).toContain(">3</span>");
    expect(markup).toContain("Phase progress details");
    expect(markup).toContain("<table");
    expect(markup).toContain('<th scope="col">Start</th>');
    expect(markup).toContain('aria-label="Latest phase 2: Cam, Bob, Amy"');
    expect(markup).not.toContain("ring-text-primary/75");
    expect(markup).not.toContain("ring-white");
    expect(markup).not.toContain("+");
  });

  it("aligns the finished checkmark with phase numbers and starts the graph closer to them", () => {
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

    expect(markup).toContain('d="M 40 180 L 296 24"');
    expect(markup).toContain('style="left:3.3333333333333335%;top:33.92857142857143%">3</span>');
    expect(markup).toContain('width="13" height="13"');
    expect(markup).toContain('x="5.5" y="17.5"');
  });

  it("keeps the finished win line visually distinct from normal phase gridlines", () => {
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

    expect(markup).toContain('stroke-dasharray="4 5"');
  });

  it("renders phase y-axis and x-axis labels with the shared unscaled axis style", () => {
    const markup = renderToStaticMarkup(
      <PhaseGraph rows={[]} totalPhases={3} series={[makePhaseGraphSeries(3)]} />,
    );

    expect(markup).toContain(
      'class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary" aria-hidden="true" style="left:3.3333333333333335%;top:33.92857142857143%">3</span>',
    );
    expect(markup).toContain(
      'class="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-sm font-medium text-text-secondary" aria-hidden="true" style="left:46.666666666666664%;top:93.75%">1</span>',
    );
    expect(markup).not.toContain('font-size="11" font-weight="500">3</text>');
    expect(markup).not.toContain('font-size="11" font-weight="600" text-anchor="middle">1</text>');
  });

  it("renders every saved Round as an x-axis tick while keeping dense text labels sparse", () => {
    const markup = renderToStaticMarkup(
      <PhaseGraph rows={[]} totalPhases={3} series={[makePhaseGraphSeries(13)]} />,
    );

    expect(markup.match(/data-round-tick=/g)).toHaveLength(13);
    expect(markup).toContain(">12</span>");
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
    expect(markup).not.toContain('font-weight="700">3</text>');
    expect(markup).not.toContain('font-weight="700">Phase 3</text>');
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
