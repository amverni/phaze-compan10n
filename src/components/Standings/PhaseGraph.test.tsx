import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { deriveStandings } from "../../data/api/standings";
import type { Game, Player, Round } from "../../types";
import { PhaseGraph } from "./PhaseGraph";

const players = {
  amy: makePlayer("amy", "Amy", "Jam", 0),
  bob: makePlayer("bob", "Bob", "Santorini", 1),
  cam: makePlayer("cam", "Cam", "Spearmint", 2),
};

describe("PhaseGraph", () => {
  it("renders a custom SVG graph with player-colored lines and uncapped latest avatar groups", () => {
    const game: Game = {
      id: "game-1",
      status: "active",
      players: [players.amy.id, players.bob.id, players.cam.id],
      activePlayers: [players.amy.id, players.bob.id, players.cam.id],
      phaseSet: {
        id: "phase-set-1",
        name: "Test phases",
        phases: ["phase-1", "phase-2", "phase-3"],
        type: "temporary",
      },
      settings: {
        tiebreaker: "lowestPoints",
        roundSkipPenalty: 100,
        sitOutPenalty: 50,
      },
      createdAt: 0,
      lastActivityAt: 0,
    };
    const standings = deriveStandings({
      game,
      players: [players.amy, players.bob, players.cam],
      rounds: [
        makeRound(1, players.cam.id, [
          { playerId: players.amy.id, currentPhase: 1, phaseStatus: "completed", score: 3 },
          { playerId: players.bob.id, currentPhase: 1, phaseStatus: "completed", score: 1 },
          { playerId: players.cam.id, currentPhase: 1, phaseStatus: "completed", score: 1 },
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
    expect(markup).toContain('d="M 48 180 L 120 128"');
    expect(markup).toContain("Start");
    expect(markup).toContain("Ph 3");
    expect(markup).toContain('aria-label="Latest phase 2: Cam, Bob, Amy"');
    expect(markup).not.toContain("+");
  });
});

function makePlayer(id: string, name: string, color: string, index: number): Player {
  return {
    id,
    name,
    color,
    createdAt: index,
    wins: 0,
    isFavorite: 0,
  };
}

function makeRound(roundNumber: number, roundWinnerId: string, scores: Round["scores"]): Round {
  return {
    gameId: "game-1",
    roundNumber,
    roundWinnerId,
    scores,
  };
}
