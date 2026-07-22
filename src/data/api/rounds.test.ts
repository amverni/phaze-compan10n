import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ActiveGame, Round } from "../../types";
import { closeDB, getDB } from "../db";
import {
  makeActiveGame,
  makeRound,
  completionPlayers as players,
} from "./gameCompletionTestFixtures";
import { gamesApi } from "./games";
import { roundsApi } from "./rounds";

describe("roundsApi.add", () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  it("keeps an Active Game active after adding a non-finishing Round", async () => {
    const game = makeActiveGame();
    await seedGame(game);

    const result = await roundsApi.add({
      gameId: game.id,
      roundWinnerId: players.amy.id,
      scores: [
        { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, phaseStatus: "failed", score: 20 },
      ],
    });

    const db = await getDB();
    const storedGame = await db.get("games", game.id);
    const storedWinner = await db.get("players", players.amy.id);

    expect(result.outcome).toBe("roundAdded");
    expect(result.round).toMatchObject({
      gameId: game.id,
      roundNumber: 1,
      roundWinnerId: players.amy.id,
    });
    expect(storedGame?.status).toBe("active");
    expect(storedWinner?.wins).toBe(players.amy.wins);
  });

  it("completes the Game and increments the Game Winner Win Count after adding a finishing Round", async () => {
    const game = makeActiveGame();
    await seedGame(game, [
      makeRound(1, players.bob.id, [
        { playerId: players.amy.id, currentPhase: 1, phaseStatus: "completed", score: 5 },
        { playerId: players.bob.id, currentPhase: 1, phaseStatus: "completed", score: 10 },
      ]),
    ]);

    const result = await roundsApi.add({
      gameId: game.id,
      roundWinnerId: players.amy.id,
      scores: [
        { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, phaseStatus: "completed", score: 2 },
      ],
    });

    const db = await getDB();
    const storedGame = await db.get("games", game.id);
    const storedWinner = await db.get("players", players.amy.id);
    const storedRound = await db.get("rounds", [game.id, 2]);

    expect(result.outcome).toBe("gameCompleted");
    if (result.outcome !== "gameCompleted") throw new Error("Expected Game completion");
    expect(result.completedGame.winnerId).toBe(players.amy.id);
    expect(result.updatedWinner.wins).toBe(players.amy.wins + 1);
    expect(storedGame).toMatchObject({
      status: "completed",
      winnerId: players.amy.id,
      winnerName: players.amy.name,
      players: [players.amy.id, players.bob.id],
    });
    expect(storedWinner?.wins).toBe(players.amy.wins + 1);
    expect(storedRound?.scores.map((score) => score.currentPhase)).toEqual([2, 2]);
  });

  it("uses Game defaults when completing a legacy Active Game without persisted settings", async () => {
    const {
      settings: _settings,
      lastActivityAt: _lastActivityAt,
      ...legacyGame
    } = makeActiveGame();
    await seedGame(legacyGame as ActiveGame, [
      makeRound(1, players.bob.id, [
        { playerId: players.amy.id, currentPhase: 1, phaseStatus: "completed", score: 5 },
        { playerId: players.bob.id, currentPhase: 1, phaseStatus: "completed", score: 10 },
      ]),
    ]);

    const result = await roundsApi.add({
      gameId: legacyGame.id,
      roundWinnerId: players.amy.id,
      scores: [
        { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, phaseStatus: "completed", score: 2 },
      ],
    });

    const db = await getDB();
    const storedGame = await db.get("games", legacyGame.id);

    expect(result.outcome).toBe("gameCompleted");
    if (result.outcome !== "gameCompleted") throw new Error("Expected Game completion");
    expect(result.completedGame.settings.tiebreaker).toBe("lowestPoints");
    expect(storedGame).toMatchObject({
      status: "completed",
      settings: {
        tiebreaker: "lowestPoints",
        roundSkipPenalty: 100,
        sitOutPenalty: 0,
      },
      winnerId: players.amy.id,
    });
  });

  it("does not decrement the Game Winner Win Count when deleting the Completed Game", async () => {
    const game = makeActiveGame();
    await seedGame(game, [
      makeRound(1, players.bob.id, [
        { playerId: players.amy.id, currentPhase: 1, phaseStatus: "completed", score: 5 },
        { playerId: players.bob.id, currentPhase: 1, phaseStatus: "completed", score: 10 },
      ]),
    ]);

    await roundsApi.add({
      gameId: game.id,
      roundWinnerId: players.amy.id,
      scores: [
        { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, phaseStatus: "completed", score: 2 },
      ],
    });
    await gamesApi.delete(game.id);

    const db = await getDB();
    const storedWinner = await db.get("players", players.amy.id);

    expect(storedWinner?.wins).toBe(players.amy.wins + 1);
  });
});

async function seedGame(game: ActiveGame, rounds: Round[] = []) {
  const db = await getDB();
  const tx = db.transaction(["players", "games", "rounds"], "readwrite");
  await Promise.all([
    tx.objectStore("players").put(players.amy),
    tx.objectStore("players").put(players.bob),
    tx.objectStore("games").put(game),
    ...rounds.map((round) => tx.objectStore("rounds").put(round)),
    tx.done,
  ]);
}

async function resetDatabase() {
  closeDB();
  await deleteDatabase("phase10-db");
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve();
  });
}
