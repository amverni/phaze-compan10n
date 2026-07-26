import { describe, expect, it } from "vitest";
import { deriveStandings } from "../../data/api/standings";
import type { PhaseGraphSeries, Round } from "../../types";
import {
  makePhaseGraphGame,
  makePhaseGraphRound,
  phaseGraphPlayers,
} from "./phaseGraphTestFixtures";
import { getPhaseGraphView } from "./phaseGraphView";

describe("getPhaseGraphView", () => {
  it("maps Start and after-round phase progress so better progress is higher on screen", () => {
    const view = getPhaseGraphView({
      series: [
        {
          player: phaseGraphPlayers.amy,
          points: [
            { roundNumber: 0, currentPhase: 1, isFinished: false, standingValue: 1 },
            { roundNumber: 1, currentPhase: 2, isFinished: false, standingValue: 2 },
            { roundNumber: 2, currentPhase: 3, isFinished: true, standingValue: 4 },
          ],
        },
        {
          player: phaseGraphPlayers.bob,
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
      { roundNumber: 0, label: "Start", showLabel: true, x: 64 },
      { roundNumber: 1, label: "1", showLabel: true, x: 136 },
      { roundNumber: 2, label: "2", showLabel: true, x: 208 },
    ]);
    expect(view.phaseLabels).toEqual([
      { value: 4, label: "Phase 3", isFinished: true, y: 24 },
      { value: 3, label: "Phase 3", isFinished: false, y: 76 },
      { value: 2, label: "Phase 2", isFinished: false, y: 128 },
      { value: 1, label: "Phase 1", isFinished: false, y: 180 },
    ]);
    expect(view.series.map((series) => series.player.id)).toEqual(["amy", "bob"]);
    expect(view.series[0]?.linePoints.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 64, y: 180 },
      { x: 136, y: 128 },
      { x: 208, y: 24 },
    ]);
    expect(view.series[0]?.path).toBe("M 64 180 L 136 128 L 208 24");
    expect(view.series[1]?.linePoints.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 64, y: 180 },
      { x: 136, y: 180 },
      { x: 208, y: 128 },
    ]);
    expect(view.width).toBe(256);
    expect(view.height).toBe(224);
    expect(view.latestEndpointGroups.find((group) => group.key === "4")).toMatchObject({
      label: "finished phase 3",
      players: [phaseGraphPlayers.amy],
    });
  });

  it("groups latest tied phase endpoints in tiebreaker order without collapsing players", () => {
    const game = makePhaseGraphGame();
    const rounds: Round[] = [
      makePhaseGraphRound(1, phaseGraphPlayers.cam.id, [
        { playerId: phaseGraphPlayers.amy.id, currentPhase: 1, phaseStatus: "completed", score: 3 },
        { playerId: phaseGraphPlayers.bob.id, currentPhase: 1, phaseStatus: "completed", score: 1 },
        { playerId: phaseGraphPlayers.cam.id, currentPhase: 1, phaseStatus: "completed", score: 1 },
      ]),
    ];
    const standings = deriveStandings({
      game,
      players: [phaseGraphPlayers.amy, phaseGraphPlayers.bob, phaseGraphPlayers.cam],
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
        x: 136,
        y: 128,
        players: [phaseGraphPlayers.cam, phaseGraphPlayers.bob, phaseGraphPlayers.amy],
      },
    ]);
  });

  it("preserves readable spacing when there are many rounds", () => {
    const series: PhaseGraphSeries[] = [
      {
        player: phaseGraphPlayers.amy,
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
    expect(view.width).toBe(976);
  });

  it("keeps large Phase Sets within the mobile graph height", () => {
    const view = getPhaseGraphView({
      totalPhases: 10,
      series: [
        {
          player: phaseGraphPlayers.amy,
          points: [
            { roundNumber: 0, currentPhase: 1, isFinished: false, standingValue: 1 },
            { roundNumber: 1, currentPhase: 10, isFinished: true, standingValue: 11 },
          ],
        },
      ],
    });

    expect(view.height).toBe(358);
    expect(view.phaseLabels).toHaveLength(11);
    expect(view.phaseLabels[0]).toMatchObject({
      label: "Phase 10",
      isFinished: true,
      y: 24,
    });
    expect(view.phaseLabels.at(-1)).toMatchObject({
      label: "Phase 1",
      isFinished: false,
      y: 314,
    });
  });
});
