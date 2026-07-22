import { describe, expect, it } from "vitest";
import type { Round } from "../../types";
import {
  makeActiveGame,
  makeRound,
  completionPlayers as players,
} from "./gameCompletionTestFixtures";
import { resolveGameCompletion } from "./roundCompletion";

describe("resolveGameCompletion", () => {
  it("does not complete an Active Game when no player has finished the final Phase", () => {
    const game = makeActiveGame();
    const rounds: Round[] = [
      makeRound(1, players.amy.id, [
        { playerId: players.amy.id, currentPhase: 1, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, currentPhase: 1, phaseStatus: "failed", score: 20 },
      ]),
    ];

    expect(
      resolveGameCompletion({
        game,
        players: [players.amy, players.bob],
        rounds,
        completedAt: 123,
      }),
    ).toBeNull();
  });

  it("completes an Active Game with the Standings Game Winner and increments their Win Count", () => {
    const game = makeActiveGame({
      players: [players.amy.id, players.bob.id, players.cam.id],
      activePlayers: [players.amy.id, players.bob.id],
    });
    const rounds: Round[] = [
      makeRound(1, players.bob.id, [
        { playerId: players.amy.id, currentPhase: 1, phaseStatus: "completed", score: 5 },
        { playerId: players.bob.id, currentPhase: 1, phaseStatus: "completed", score: 10 },
      ]),
      makeRound(2, players.amy.id, [
        { playerId: players.amy.id, currentPhase: 2, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, currentPhase: 2, phaseStatus: "completed", score: 2 },
      ]),
    ];

    const resolution = resolveGameCompletion({
      game,
      players: [players.amy, players.bob, players.cam],
      rounds,
      completedAt: 456,
    });

    expect(resolution).toEqual({
      completedGame: {
        id: game.id,
        status: "completed",
        phaseSet: game.phaseSet,
        players: [players.amy.id, players.bob.id],
        settings: game.settings,
        createdAt: game.createdAt,
        lastActivityAt: 456,
        completedAt: 456,
        winnerId: players.amy.id,
        winnerName: players.amy.name,
      },
      gameWinner: players.amy,
      incrementedWinner: {
        ...players.amy,
        wins: players.amy.wins + 1,
      },
    });
  });
});
