import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { GameTiebreaker } from "../../types";
import { closeDB } from "../db";
import { gamesApi } from "./games";
import { playersApi } from "./players";
import { roundsApi } from "./rounds";
import { deriveStandings } from "./standings";

beforeEach(resetDatabase);
afterEach(resetDatabase);

it("awards every first-place Player on Early Finish without using display fallbacks or granting phase progress", async () => {
  const { game, amy, bob, cam } = await createGame();
  await roundsApi.add({
    gameId: game.id,
    roundWinnerId: bob.id,
    scores: [
      { playerId: amy.id, phaseStatus: "completed", score: 0 },
      { playerId: bob.id, phaseStatus: "completed", score: 0 },
      { playerId: cam.id, phaseStatus: "failed", score: 20 },
    ],
  });
  const rounds = await roundsApi.getByGameId(game.id);
  const before = deriveStandings({
    game,
    players: [amy, bob, cam].map(({ id, name, color }) => ({ id, name, color })),
    rounds,
  });
  const completed = await gamesApi.finish(game.id);
  closeDB();

  expect(await gamesApi.getById(game.id)).toEqual(completed);
  expect(completed).toMatchObject({
    status: "completed",
    completionType: "manual",
    completedAt: expect.any(Number),
    lastActivityAt: completed.completedAt,
    winnerIds: [bob.id, amy.id],
    playerSnapshots: [
      { id: amy.id, name: "Amy", color: "Jam" },
      { id: bob.id, name: "Bob", color: "Ocean" },
      { id: cam.id, name: "Cam", color: "Jam" },
    ],
  });
  expect(completed).not.toHaveProperty("activePlayers");
  expect(await roundsApi.getByGameId(game.id)).toEqual(rounds);
  await playersApi.update(amy.id, { name: "Amelia", color: "Ocean" });
  await playersApi.delete(bob.id);
  const after = deriveStandings({ game: completed, players: await playersApi.getAll(), rounds });
  expect(after.rows).toEqual(before.rows);
  expect(after.rows.map((row) => [row.player.id, row.place, row.progress.currentPhase])).toEqual([
    [bob.id, 1, 2],
    [amy.id, 1, 2],
    [cam.id, 3, 1],
  ]);
  expect(after.hasFinishedPlayers).toBe(false);
  expect(after.phaseGraphSeries).toEqual(before.phaseGraphSeries);
  expect(after.tiebreakerGraphSeries).toEqual(before.tiebreakerGraphSeries);
});

it.each<{ tiebreaker: GameTiebreaker; winner: "amy" | "bob" }>([
  { tiebreaker: "lowestPoints", winner: "amy" },
  { tiebreaker: "highestPoints", winner: "bob" },
  { tiebreaker: "fewestWilds", winner: "amy" },
  { tiebreaker: "fewestSkips", winner: "amy" },
  { tiebreaker: "mostSkipped", winner: "bob" },
  { tiebreaker: "roundsWon", winner: "bob" },
])("resolves an untied Early Finish using phase progress then $tiebreaker", async ({
  tiebreaker,
  winner,
}) => {
  const { game, amy, bob, cam } = await createGame(tiebreaker);
  await roundsApi.add({
    gameId: game.id,
    roundWinnerId: bob.id,
    scores: [
      { playerId: amy.id, phaseStatus: "completed", score: 1 },
      { playerId: bob.id, phaseStatus: "completed", score: 2 },
      { playerId: cam.id, phaseStatus: "failed", score: 0 },
    ],
  });
  const completed = await gamesApi.finish(game.id);
  expect(completed.winnerIds).toEqual([winner === "amy" ? amy.id : bob.id]);
  await expect(gamesApi.finish(game.id)).rejects.toThrow("completed");
  await expect(roundsApi.delete(game.id, 1)).rejects.toThrow("completed");
  expect(await gamesApi.getById(game.id)).toEqual(completed);
});

it("rejects zero-round completion without changing the Active Game or awarding a result", async () => {
  const { game, amy } = await createGame();
  await expect(gamesApi.finish(game.id)).rejects.toThrow("at least one saved Round");
  closeDB();
  expect(await gamesApi.getById(game.id)).toEqual(game);
  expect(await roundsApi.getByGameId(game.id)).toEqual([]);
  await expect(playersApi.delete(amy.id)).rejects.toThrow("Active Game");
});

it("does not award an Early Finish win to Players tied below first place", async () => {
  const { game, amy, bob, cam } = await createGame();
  await roundsApi.add({
    gameId: game.id,
    roundWinnerId: amy.id,
    scores: [
      { playerId: amy.id, phaseStatus: "completed", score: 0 },
      { playerId: bob.id, phaseStatus: "failed", score: 20 },
      { playerId: cam.id, phaseStatus: "failed", score: 20 },
    ],
  });
  const completed = await gamesApi.finish(game.id);
  expect(completed.winnerIds).toEqual([amy.id]);
  const standings = deriveStandings({
    game: completed,
    players: [],
    rounds: await roundsApi.getByGameId(game.id),
  });
  expect(standings.rows.map((row) => row.place)).toEqual([1, 2, 2]);
});

it("rolls back a failed Early Finish and allows a later retry", async () => {
  const { game, amy, bob, cam } = await createGame();
  await roundsApi.add({
    gameId: game.id,
    roundWinnerId: amy.id,
    scores: [
      { playerId: amy.id, phaseStatus: "completed", score: 0 },
      { playerId: bob.id, phaseStatus: "failed", score: 20 },
      { playerId: cam.id, phaseStatus: "failed", score: 10 },
    ],
  });
  const before = await gamesApi.getById(game.id);
  const rounds = await roundsApi.getByGameId(game.id);
  const put = IDBObjectStore.prototype.put;
  const failure = vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
    this: IDBObjectStore,
    value: unknown,
    key?: IDBValidKey,
  ) {
    if (this.name === "games") throw new DOMException("Result write failed", "QuotaExceededError");
    return put.call(this, value, key);
  });
  try {
    await expect(gamesApi.finish(game.id)).rejects.toThrow("Result write failed");
  } finally {
    failure.mockRestore();
  }
  closeDB();
  expect(await gamesApi.getById(game.id)).toEqual(before);
  expect(await roundsApi.getByGameId(game.id)).toEqual(rounds);
  await expect(playersApi.delete(amy.id)).rejects.toThrow("Active Game");
  expect((await gamesApi.finish(game.id)).winnerIds).toEqual([amy.id]);
});

async function createGame(tiebreaker: GameTiebreaker = "lowestPoints") {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 });
  const cam = await playersApi.create({ name: "Cam", color: "Jam", isFavorite: 0 });
  const game = await gamesApi.create({
    players: [amy.id, bob.id, cam.id],
    phaseSet: {
      id: "short",
      type: "temporary",
      name: "Short",
      phases: ["phase-1", "phase-2", "phase-3"],
    },
    settings: { tiebreaker, roundSkipPenalty: 100, sitOutPenalty: 0 },
  });
  return { game, amy, bob, cam };
}

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}
