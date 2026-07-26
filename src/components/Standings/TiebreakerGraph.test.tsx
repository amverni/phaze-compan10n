import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { deriveStandings } from "../../data/api/standings";
import {
  makePhaseGraphGame,
  makePhaseGraphRound,
  phaseGraphPlayers,
} from "./phaseGraphTestFixtures";
import { TiebreakerGraph } from "./TiebreakerGraph";

describe("TiebreakerGraph", () => {
  it("renders a fitted custom SVG graph with compact Tiebreaker axes and uncapped latest avatar groups", () => {
    const game = makePhaseGraphGame({
      settings: {
        tiebreaker: "lowestPoints",
        roundSkipPenalty: 100,
        sitOutPenalty: 50,
      },
    });
    const rounds = [
      makePhaseGraphRound(1, phaseGraphPlayers.cam.id, [
        {
          playerId: phaseGraphPlayers.amy.id,
          currentPhase: 1,
          phaseStatus: "completed",
          score: 10,
        },
        {
          playerId: phaseGraphPlayers.bob.id,
          currentPhase: 1,
          phaseStatus: "completed",
          score: 20,
        },
        {
          playerId: phaseGraphPlayers.cam.id,
          currentPhase: 1,
          phaseStatus: "completed",
          score: 10,
        },
      ]),
      makePhaseGraphRound(2, phaseGraphPlayers.bob.id, [
        { playerId: phaseGraphPlayers.amy.id, currentPhase: 2, phaseStatus: "failed", score: 0 },
        { playerId: phaseGraphPlayers.bob.id, currentPhase: 2, phaseStatus: "completed", score: 5 },
        { playerId: phaseGraphPlayers.cam.id, currentPhase: 2, phaseStatus: "failed", score: 0 },
      ]),
    ];
    const standings = deriveStandings({
      game,
      players: [phaseGraphPlayers.amy, phaseGraphPlayers.bob, phaseGraphPlayers.cam],
      rounds,
    });

    const markup = renderToStaticMarkup(
      <TiebreakerGraph
        series={standings.tiebreakerGraphSeries}
        tiebreaker={game.settings.tiebreaker}
        rounds={rounds}
      />,
    );

    expect(markup).toContain('aria-label="Tiebreaker progress by round"');
    expect(markup).toContain("<svg");
    expect(markup).toContain('stroke="#df0e88"');
    expect(markup).toContain('stroke="#1D4ED8"');
    expect(markup).toContain('d="M 64 24 L 180 86.4 L 296 86.4"');
    expect(markup).toContain(">0 pts</text>");
    expect(markup).toContain(">25 pts</text>");
    expect(markup).not.toContain(">Start</text>");
    expect(markup).toContain("Tiebreaker progress details");
    expect(markup).toContain("<table");
    expect(markup).toContain('<th scope="col">Start</th>');
    expect(markup).toContain("10 pts");
    expect(markup).toContain('aria-label="Latest 10 pts: Cam, Amy"');
    expect(markup.match(/data-round-tick=/g)).toHaveLength(3);
    expect(markup).not.toContain("Scrollable");
    expect(markup).not.toContain("overflow-x-auto");
    expect(markup).not.toContain("data-swipe-navigation-ignore");
    expect(markup).not.toContain("+");
  });

  it("renders every saved Round as an x-axis tick while thinning dense labels", () => {
    const markup = renderToStaticMarkup(
      <TiebreakerGraph
        tiebreaker="roundsWon"
        rounds={[]}
        series={[
          {
            player: phaseGraphPlayers.amy,
            points: Array.from({ length: 13 }, (_, index) => ({
              roundNumber: index,
              value: index,
              standingValue: index,
            })),
          },
        ]}
      />,
    );

    expect(markup.match(/data-round-tick=/g)).toHaveLength(13);
    expect(markup).toContain(">12</text>");
    expect(markup).not.toContain(">Start</text>");
  });

  it("wraps latest endpoint avatar groups without clipping lower chart rows", () => {
    const tiedPlayers = Array.from({ length: 20 }, (_, index) => ({
      ...phaseGraphPlayers.amy,
      id: `player-${index}`,
      name: `Player ${index + 1}`,
      createdAt: index,
    }));
    const betterPlayer = {
      ...phaseGraphPlayers.bob,
      id: "better-player",
      name: "Better Player",
      createdAt: tiedPlayers.length,
    };

    const markup = renderToStaticMarkup(
      <TiebreakerGraph
        tiebreaker="highestPoints"
        rounds={[]}
        series={[
          ...tiedPlayers.map((player) => ({
            player,
            points: [
              { roundNumber: 0, value: 0, standingValue: 0 },
              { roundNumber: 12, value: 0, standingValue: 0 },
            ],
          })),
          {
            player: betterPlayer,
            points: [
              { roundNumber: 0, value: 0, standingValue: 0 },
              { roundNumber: 12, value: 10, standingValue: 10 },
            ],
          },
        ]}
      />,
    );

    expect(markup).toContain("Player 20");
    expect(markup).toContain("max-width:100%");
    expect(markup).toContain("flex-wrap:wrap");
    expect(markup).toContain(
      "bottom:clamp(0px, calc(19.64285714285714% - 13px), calc(100% - 26px))",
    );
  });

  it("shows an empty state when there are no Tiebreaker totals to graph", () => {
    const markup = renderToStaticMarkup(
      <TiebreakerGraph series={[]} tiebreaker="lowestPoints" rounds={[]} />,
    );

    expect(markup).toContain("No Tiebreaker progress to show yet.");
  });
});
