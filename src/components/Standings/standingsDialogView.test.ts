import { describe, expect, it } from "vitest";
import type { Player, StandingsDerivation } from "../../types";
import { getStandingsDisplayRows } from "./standingsDialogView";

const players = {
  amy: makePlayer("amy", "Amy"),
  bob: makePlayer("bob", "Bob"),
};

describe("getStandingsDisplayRows", () => {
  it("builds compact row display data while preserving hidden tied places", () => {
    const rows = getStandingsDisplayRows({
      includedPlayers: [players.amy, players.bob],
      rows: [
        {
          player: players.amy,
          place: 1,
          showPlace: true,
          progress: {
            currentPhase: 3,
            isFinished: true,
            standingValue: 4,
          },
          tiebreakerTotal: 12,
          formattedTiebreaker: "12 pts",
        },
        {
          player: players.bob,
          place: 1,
          showPlace: false,
          progress: {
            currentPhase: 3,
            isFinished: true,
            standingValue: 4,
          },
          tiebreakerTotal: 12,
          formattedTiebreaker: "12 pts",
        },
      ],
      phaseGraphSeries: [],
      tiebreakerGraphSeries: [],
      hasFinishedPlayers: true,
      gameWinner: null,
    } satisfies StandingsDerivation);

    expect(rows).toEqual([
      {
        player: players.amy,
        place: 1,
        showPlace: true,
        phaseNumber: 3,
        isFinished: true,
        tiebreakerText: "12 pts",
      },
      {
        player: players.bob,
        place: 1,
        showPlace: false,
        phaseNumber: 3,
        isFinished: true,
        tiebreakerText: "12 pts",
      },
    ]);
  });
});

function makePlayer(id: string, name: string): Player {
  return {
    id,
    name,
    color: "Jam",
    createdAt: 0,
    wins: 0,
    isFavorite: 0,
  };
}
