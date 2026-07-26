import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { deriveStandings } from "../../data/api/standings";
import { PhaseGraph } from "./PhaseGraph";
import {
  makePhaseGraphGame,
  makePhaseGraphRound,
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
    expect(markup).toContain('d="M 64 180 L 136 128"');
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
      <PhaseGraph
        rows={[]}
        totalPhases={3}
        series={[
          {
            player: phaseGraphPlayers.amy,
            points: Array.from({ length: 13 }, (_, index) => ({
              roundNumber: index,
              currentPhase: Math.min(index + 1, 3),
              isFinished: index > 3,
              standingValue: Math.min(index + 1, 4),
            })),
          },
        ]}
      />,
    );

    expect(markup.match(/data-round-tick=/g)).toHaveLength(13);
    expect(markup).toContain(">12</text>");
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
