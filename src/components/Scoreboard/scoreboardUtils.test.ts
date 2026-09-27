import { describe, expect, it } from "vitest";
import type { Round } from "../../types";
import { formatTiebreaker, getTiebreakerValue } from "./scoreboardUtils";

describe("scoreboardUtils tiebreakers", () => {
  it("formats tiebreaker values with shared domain-specific units", () => {
    expect(formatTiebreaker(1, "fewestWilds")).toBe("1 wild");
    expect(formatTiebreaker(2, "fewestWilds")).toBe("2 wilds");
    expect(formatTiebreaker(1, "fewestSkips")).toBe("1 skip");
    expect(formatTiebreaker(2, "fewestSkips")).toBe("2 skips");
    expect(formatTiebreaker(1, "mostSkipped")).toBe("1 skip");
    expect(formatTiebreaker(2, "mostSkipped")).toBe("2 skips");
  });

  it("returns one rounds-won tiebreaker value for the round winner", () => {
    const round = {
      gameId: "game-1",
      scorekeeper: "phase10",
      roundNumber: 1,
      roundWinnerId: "player-1",
      scores: [
        {
          playerId: "player-1",
          currentPhase: 1,
          phaseStatus: "completed",
          score: 0,
        },
        {
          playerId: "player-2",
          currentPhase: 1,
          phaseStatus: "failed",
          score: 0,
        },
      ],
    } as Round;

    expect(getTiebreakerValue(round, "player-1", "roundsWon")).toBe(1);
    expect(getTiebreakerValue(round, "player-2", "roundsWon")).toBe(0);
  });

  it("does not count a rounds-won tiebreaker value when the round winner has no score entry", () => {
    const round = {
      gameId: "game-1",
      scorekeeper: "phase10",
      roundNumber: 1,
      roundWinnerId: "player-1",
      scores: [
        {
          playerId: "player-2",
          currentPhase: 1,
          phaseStatus: "failed",
          score: 0,
        },
      ],
    } as Round;

    expect(getTiebreakerValue(round, "player-1", "roundsWon")).toBe(0);
  });
});
