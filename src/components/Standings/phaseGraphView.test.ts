import { describe, expect, it } from "vitest";
import { deriveStandings } from "../../data/api/standings";
import type { Game, PhaseGraphSeries, Player, Round } from "../../types";
import { getPhaseGraphView } from "./phaseGraphView";

const players = {
  amy: makePlayer("amy", "Amy", "Jam", 0),
  bob: makePlayer("bob", "Bob", "Santorini", 1),
  cam: makePlayer("cam", "Cam", "Spearmint", 2),
};

describe("getPhaseGraphView", () => {
  it("maps Start and after-round phase progress so better progress is higher on screen", () => {
    const view = getPhaseGraphView({
      series: [
        {
          player: players.amy,
          points: [
            { roundNumber: 0, currentPhase: 1, isFinished: false, standingValue: 1 },
            { roundNumber: 1, currentPhase: 2, isFinished: false, standingValue: 2 },
            { roundNumber: 2, currentPhase: 3, isFinished: true, standingValue: 4 },
          ],
        },
        {
          player: players.bob,
          points: [
            { roundNumber: 0, currentPhase: 1, isFinished: false, standingValue: 1 },
            { roundNumber: 1, currentPhase: 1, isFinished: false, standingValue: 1 },
            { roundNumber: 2, currentPhase: 2, isFinished: false, standingValue: 2 },
          ],
        },
      ],
      totalPhases: 3,
    });

    expect(view.roundLabels).toEqual([
      { roundNumber: 0, label: "Start", showLabel: true, x: 48 },
      { roundNumber: 1, label: "1", showLabel: true, x: 120 },
      { roundNumber: 2, label: "2", showLabel: true, x: 192 },
    ]);
    expect(view.phaseLabels).toEqual([
      { value: 4, label: "Ph 3", isFinished: true, y: 24 },
      { value: 3, label: "Ph 3", isFinished: false, y: 76 },
      { value: 2, label: "Ph 2", isFinished: false, y: 128 },
      { value: 1, label: "Ph 1", isFinished: false, y: 180 },
    ]);
    expect(view.series.map((series) => series.player.id)).toEqual(["amy", "bob"]);
    expect(view.series[0]?.linePoints.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 48, y: 180 },
      { x: 120, y: 128 },
      { x: 192, y: 24 },
    ]);
    expect(view.series[0]?.path).toBe("M 48 180 L 120 128 L 192 24");
    expect(view.series[1]?.linePoints.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 48, y: 180 },
      { x: 120, y: 180 },
      { x: 192, y: 128 },
    ]);
    expect(view.width).toBe(240);
    expect(view.height).toBe(224);
    expect(view.latestEndpointGroups.find((group) => group.key === "4")).toMatchObject({
      label: "finished phase 3",
      players: [players.amy],
    });
  });

  it("groups latest tied phase endpoints in tiebreaker order without collapsing players", () => {
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
    const rounds: Round[] = [
      makeRound(1, players.cam.id, [
        { playerId: players.amy.id, currentPhase: 1, phaseStatus: "completed", score: 3 },
        { playerId: players.bob.id, currentPhase: 1, phaseStatus: "completed", score: 1 },
        { playerId: players.cam.id, currentPhase: 1, phaseStatus: "completed", score: 1 },
      ]),
    ];
    const standings = deriveStandings({
      game,
      players: [players.amy, players.bob, players.cam],
      rounds,
    });

    const view = getPhaseGraphView({
      series: standings.phaseGraphSeries,
      totalPhases: 3,
      rows: standings.rows,
    });

    expect(view.latestEndpointGroups).toEqual([
      {
        key: "2",
        label: "phase 2",
        x: 120,
        y: 128,
        players: [players.cam, players.bob, players.amy],
      },
    ]);
  });

  it("preserves readable spacing when there are many rounds", () => {
    const series: PhaseGraphSeries[] = [
      {
        player: players.amy,
        points: Array.from({ length: 13 }, (_, index) => ({
          roundNumber: index,
          currentPhase: Math.min(index + 1, 3),
          isFinished: index > 3,
          standingValue: Math.min(index + 1, 4),
        })),
      },
    ];

    const view = getPhaseGraphView({ series, totalPhases: 3 });

    expect(view.roundLabels).toHaveLength(13);
    expect(view.roundLabels.filter((label) => label.showLabel).map((label) => label.label)).toEqual(
      ["Start", "2", "4", "6", "8", "10", "12"],
    );
    expect(view.width).toBe(960);
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
