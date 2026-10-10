import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ActiveGame, GameTiebreaker, Round } from "../../types";
import { closeDB, getDB } from "../db";
import {
  makeActiveGame,
  makeRound,
  completionPlayers as players,
} from "./gameCompletionTestFixtures";
import { gamesApi } from "./games";
import { playersApi } from "./players";
import { roundsApi } from "./rounds";

describe("roundsApi.add", () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  it("rejects a missing required Round Winner without saving or completing the Game", async () => {
    const game = makeActiveGame({
      settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 50 },
      phaseSet: { id: "one-phase", type: "temporary", name: "One Phase", phases: ["phase-1"] },
    });
    await seedGame(game);

    await expect(
      roundsApi.add({
        gameId: game.id,
        roundWinnerId: null,
        scores: [
          { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
          { playerId: players.bob.id, phaseStatus: "failed", score: 0 },
        ],
      }),
    ).rejects.toThrow("Round Winner");

    expect(await roundsApi.getByGameId(game.id)).toEqual([]);
    expect(await gamesApi.getById(game.id)).toEqual(game);
  });

  it.each([
    { reason: "Failed", winner: players.amy.id, status: "failed" as const },
    { reason: "Skipped", winner: players.amy.id, status: "skipped" as const },
    { reason: "Sat Out", winner: players.amy.id, status: "satOut" as const },
    { reason: "outside the Game", winner: players.cam.id, status: "completed" as const },
    { reason: "empty identifier", winner: "", status: "completed" as const },
    { reason: "inactive", winner: players.bob.id, status: "completed" as const },
    { reason: "absent from the Round", winner: players.cam.id, status: "completed" as const },
  ])("rejects a supplied Round Winner that is $reason atomically", async ({
    reason,
    winner,
    status,
  }) => {
    const game = makeActiveGame({
      activePlayers:
        reason === "inactive"
          ? [players.amy.id]
          : reason === "absent from the Round"
            ? [players.amy.id, players.bob.id, players.cam.id]
            : [players.amy.id, players.bob.id],
      phaseSet: { id: "one-phase", type: "temporary", name: "One Phase", phases: ["phase-1"] },
    });
    await seedGame(game);

    await expect(
      roundsApi.add({
        gameId: game.id,
        roundWinnerId: winner,
        scores: [
          { playerId: players.amy.id, phaseStatus: status, score: 0 },
          { playerId: players.bob.id, phaseStatus: "completed", score: 0 },
        ],
      }),
    ).rejects.toThrow("Round Winner");

    expect(await roundsApi.getByGameId(game.id)).toEqual([]);
    expect(await gamesApi.getById(game.id)).toEqual(game);
  });

  it.each<GameTiebreaker>([
    "lowestPoints",
    "highestPoints",
    "fewestWilds",
    "fewestSkips",
    "mostSkipped",
  ])("persists explicit null without inferring a Round Winner for %s", async (tiebreaker) => {
    const game = makeActiveGame({
      settings: { tiebreaker, roundSkipPenalty: 100, sitOutPenalty: 50 },
    });
    await seedGame(game);

    const result = await roundsApi.add({
      gameId: game.id,
      roundWinnerId: null,
      scores: [
        { playerId: players.bob.id, phaseStatus: "completed", score: 0 },
        { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
      ],
    });
    expect(result.outcome).toBe("roundAdded");
    expect(result.round.roundWinnerId).toBeNull();
    closeDB();
    expect(await roundsApi.getByGameId(game.id)).toEqual([result.round]);
    expect(await gamesApi.getById(game.id)).toMatchObject({ status: "active" });
  });

  it.each([
    ["skipped", "skipped"],
    ["satOut", "satOut"],
    ["skipped", "satOut"],
  ] as const)("saves Rounds Won without a winner when results are %s and %s", async (amy, bob) => {
    const game = makeActiveGame({
      settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 50 },
    });
    await seedGame(game);

    const result = await roundsApi.add({
      gameId: game.id,
      roundWinnerId: null,
      scores: [
        { playerId: players.amy.id, phaseStatus: amy, score: 0 },
        { playerId: players.bob.id, phaseStatus: bob, score: 0 },
      ],
    });
    closeDB();
    expect(await roundsApi.getByGameId(game.id)).toEqual([result.round]);
    expect(result.round.roundWinnerId).toBeNull();
    expect(result.outcome).toBe("roundAdded");
  });

  it("does not exempt all-Failed or incomplete Active Player input from the winner requirement", async () => {
    const game = makeActiveGame({
      settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 50 },
    });
    await seedGame(game);
    const inputs: Parameters<typeof roundsApi.add>[0]["scores"][] = [
      [
        { playerId: players.amy.id, phaseStatus: "failed", score: 0 },
        { playerId: players.bob.id, phaseStatus: "failed", score: 0 },
      ],
      [{ playerId: players.amy.id, phaseStatus: "skipped", score: 0 }],
    ];
    for (const scores of inputs) {
      await expect(roundsApi.add({ gameId: game.id, roundWinnerId: null, scores })).rejects.toThrow(
        "Round Winner",
      );
    }
    // JavaScript callers can omit fields or supply empty input despite the TypeScript contract.
    await expect(
      // @ts-expect-error Empty input must not activate the all-Skipped/Sat Out exception.
      roundsApi.add({ gameId: game.id, roundWinnerId: null, scores: [] }),
    ).rejects.toThrow("Round Winner");
    await expect(
      // @ts-expect-error Callers must explicitly provide a winner identifier or null.
      roundsApi.add({ gameId: game.id, scores: inputs[0] }),
    ).rejects.toThrow("Round Winner");
    expect(await roundsApi.getByGameId(game.id)).toEqual([]);
    expect(await gamesApi.getById(game.id)).toEqual(game);
  });

  it("rejects conflicting duplicate winner entries instead of awarding a Skipped Player a win", async () => {
    const game = makeActiveGame({
      settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 50 },
      phaseSet: { id: "one-phase", type: "temporary", name: "One Phase", phases: ["phase-1"] },
    });
    await seedGame(game);
    await expect(
      roundsApi.add({
        gameId: game.id,
        roundWinnerId: players.amy.id,
        scores: [
          { playerId: players.amy.id, phaseStatus: "skipped", score: 0 },
          { playerId: players.bob.id, phaseStatus: "skipped", score: 0 },
          { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
        ],
      }),
    ).rejects.toThrow("Round Winner");
    expect(await roundsApi.getByGameId(game.id)).toEqual([]);
    expect(await gamesApi.getById(game.id)).toEqual(game);
  });

  it.each([
    true,
    false,
  ])("completes a winnerless final Round with historical wins preserved (recorded win: %s)", async (recordedWin) => {
    const game = makeActiveGame();
    await seedGame(game);
    await roundsApi.add({
      gameId: game.id,
      roundWinnerId: recordedWin ? players.bob.id : null,
      scores: [
        { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, phaseStatus: "completed", score: 0 },
      ],
    });
    closeDB();
    const result = await roundsApi.add({
      gameId: game.id,
      roundWinnerId: null,
      scores: [
        { playerId: players.amy.id, phaseStatus: "completed", score: 0 },
        { playerId: players.bob.id, phaseStatus: "completed", score: 0 },
      ],
    });
    expect(result.outcome).toBe("gameCompleted");
    if (result.outcome !== "gameCompleted") throw new Error("Expected Game completion");
    const winnerId = recordedWin ? players.bob.id : players.amy.id;
    expect(result.completedGame.winnerIds).toEqual([winnerId]);
    closeDB();
    expect(await gamesApi.getById(game.id)).toMatchObject({
      status: "completed",
      completionType: "normal",
      winnerIds: [winnerId],
    });
    expect(await roundsApi.getByGameId(game.id)).toMatchObject([
      { roundWinnerId: recordedWin ? players.bob.id : null },
      { roundWinnerId: null, scores: [{ currentPhase: 2 }, { currentPhase: 2 }] },
    ]);
  });

  it("normally completes an all-Skipped final Round with no recorded wins", async () => {
    const game = makeActiveGame({
      settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 50 },
      phaseSet: { id: "one-phase", type: "temporary", name: "One Phase", phases: ["phase-1"] },
    });
    await seedGame(game);
    const result = await roundsApi.add({
      gameId: game.id,
      roundWinnerId: null,
      scores: [
        { playerId: players.bob.id, phaseStatus: "skipped", score: 0 },
        { playerId: players.amy.id, phaseStatus: "skipped", score: 0 },
      ],
    });
    expect(result.outcome).toBe("gameCompleted");
    if (result.outcome !== "gameCompleted") throw new Error("Expected Game completion");
    expect(result.completedGame.winnerIds).toEqual([players.amy.id]);
    closeDB();
    expect(await roundsApi.getByGameId(game.id)).toEqual([result.round]);
    expect(await gamesApi.getById(game.id)).toMatchObject({ status: "completed" });
  });

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

    expect(result.outcome).toBe("roundAdded");
    expect(result.round).toMatchObject({
      gameId: game.id,
      roundNumber: 1,
      roundWinnerId: players.amy.id,
    });
    expect(storedGame?.status).toBe("active");
    expect(await playersApi.getAll()).toEqual([players.amy, players.bob]);
  });

  it("completes the Game with its Game Winner without changing saved Players", async () => {
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
    const storedRound = (await roundsApi.getByGameId(game.id)).find(
      (round) => round.roundNumber === 2,
    );

    expect(result.outcome).toBe("gameCompleted");
    if (result.outcome !== "gameCompleted") throw new Error("Expected Game completion");
    expect(result.completedGame.winnerIds).toEqual([players.amy.id]);
    expect(result.gameWinner).toEqual(players.amy);
    expect(result).not.toHaveProperty("updatedWinner");
    expect(storedGame).toMatchObject({
      status: "completed",
      winnerIds: [players.amy.id],
      players: [players.amy.id, players.bob.id],
    });
    expect(await playersApi.getAll()).toEqual([players.amy, players.bob]);
    expect(storedRound?.scores.map((score) => score.currentPhase)).toEqual([2, 2]);
  });

  it("leaves saved Players unchanged when deleting a Completed Game", async () => {
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

    expect(await playersApi.getAll()).toEqual([players.amy, players.bob]);
    expect(await gamesApi.getById(game.id)).toBeUndefined();
    expect(await roundsApi.getByGameId(game.id)).toEqual([]);
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
