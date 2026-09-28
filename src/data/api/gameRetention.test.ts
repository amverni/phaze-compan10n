import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ActiveGame, ActiveGenericGame, Player, TemporaryPhaseSet } from "../../types";
import { closeDB, getDB } from "../db";
import { gamesApi } from "./games";
import { genericGamesApi } from "./genericGames";
import { genericRoundsApi } from "./genericRounds";
import { phaseSetsApi } from "./phaseSets";
import { phasesApi } from "./phases";
import { playersApi } from "./players";
import { roundsApi } from "./rounds";

beforeEach(resetDatabase);
afterEach(async () => {
  vi.restoreAllMocks();
  await resetDatabase();
});

it.each([
  "normal",
  "early",
] as const)("retains only the latest 20 Completed Games and their Rounds without limiting Active Games (%s completion)", async (method) => {
  const players = await createPlayers();
  const clock = vi.spyOn(Date, "now");
  const completedIds: string[] = [];
  const activeGames: ActiveGame[] = [];
  for (let index = 0; index < 21; index++) {
    clock.mockReturnValue(index + 1);
    const game = await createGame(
      players,
      method === "normal"
        ? undefined
        : {
            id: "longer",
            type: "temporary",
            name: "Longer",
            phases: ["phase-1", "phase-2"],
          },
    );
    if (method === "normal") {
      await finishGame(game);
    } else {
      await addRound(game);
      await gamesApi.finish(game.id);
    }
    completedIds.push(game.id);
    activeGames.push(await createGame(players));
  }

  closeDB();
  const games = await gamesApi.getAll();
  expect(
    games
      .filter((game) => game.status === "completed")
      .map((game) => game.id)
      .sort(),
  ).toEqual(completedIds.slice(1).sort());
  expect(await gamesApi.getById(completedIds[0])).toBeUndefined();
  expect(await roundsApi.getByGameId(completedIds[0])).toEqual([]);
  for (const id of completedIds.slice(1)) {
    expect(await roundsApi.getByGameId(id)).toHaveLength(1);
  }
  expect((await gamesApi.getActive()).sort((a, b) => a.id.localeCompare(b.id))).toEqual(
    activeGames.sort((a, b) => a.id.localeCompare(b.id)),
  );
  expect(await playersApi.getAll()).toEqual(players);
});

it("preserves actual completion order across reloads when completion timestamps tie", async () => {
  const players = await createPlayers();
  vi.spyOn(Date, "now").mockReturnValue(100);
  vi.spyOn(crypto, "randomUUID").mockReturnValueOnce("00000000-0000-4000-8000-000000000000");
  const first = await createGame(players);
  await finishGame(first);
  const retainedIds: string[] = [];
  for (let index = 0; index < 20; index++) {
    closeDB();
    const game = await createGame(players);
    await finishGame(game);
    retainedIds.push(game.id);
  }

  closeDB();
  expect(await gamesApi.getById(first.id)).toBeUndefined();
  const retained = await gamesApi.getAll();
  expect(retained.map((game) => game.id).sort()).toEqual(retainedIds.sort());
  for (const game of retained) {
    expect(game).toMatchObject({ status: "completed", completedAt: 100, lastActivityAt: 100 });
  }
});

it("retains the latest 20 completions independently per Scorekeeper, preserving all Active Games and owned Rounds", async () => {
  const players = await createPlayers();
  const clock = vi.spyOn(Date, "now");
  const phaseGames: ActiveGame[] = [];
  const genericGames: ActiveGenericGame[] = [];
  const activePhase: ActiveGame[] = [];
  const activeGeneric: ActiveGenericGame[] = [];
  for (let index = 0; index < 21; index++) {
    clock.mockReturnValue(index + 1);
    const phase = await createGame(players);
    await finishGame(phase);
    phaseGames.push(phase);
    const generic = await createGenericGame(players);
    await addGenericRound(generic);
    await genericGamesApi.finish(generic.id);
    genericGames.push(generic);
    activePhase.push(await createGame(players));
    activeGeneric.push(await createGenericGame(players));
  }

  closeDB();
  const phaseRows = await gamesApi.getList();
  const genericRows = await genericGamesApi.getList();
  expect(phaseRows.filter((game) => game.status === "completed").map((game) => game.id)).toEqual(
    phaseGames
      .slice(1)
      .reverse()
      .map((game) => game.id),
  );
  expect(genericRows.filter((game) => game.status === "completed").map((game) => game.id)).toEqual(
    genericGames
      .slice(1)
      .reverse()
      .map((game) => game.id),
  );
  expect(await gamesApi.getActive()).toEqual([...activePhase].reverse());
  expect(await genericGamesApi.getActive()).toEqual([...activeGeneric].reverse());
  expect(await gamesApi.getById(phaseGames[0].id)).toBeUndefined();
  expect(await genericGamesApi.getById(genericGames[0].id)).toBeUndefined();
  for (const game of phaseGames.slice(1)) {
    expect(await roundsApi.getByGameId(game.id)).toHaveLength(1);
  }
  for (const game of genericGames.slice(1)) {
    expect(await genericRoundsApi.getByGameId(game.id)).toHaveLength(1);
  }

  // Reintroduce the evicted ids to expose any dangling Rounds through the public APIs.
  const db = await getDB();
  await db.put("games", phaseGames[0]);
  await db.put("games", genericGames[0]);
  expect(await roundsApi.getByGameId(phaseGames[0].id)).toEqual([]);
  expect(await genericRoundsApi.getByGameId(genericGames[0].id)).toEqual([]);
  await gamesApi.delete(phaseGames[0].id);
  await genericGamesApi.delete(genericGames[0].id);
  expect(await playersApi.getAll()).toEqual(players);
  await genericGamesApi.delete(genericGames[1].id);
  expect(await gamesApi.getList()).toEqual(phaseRows);
  expect(await genericGamesApi.getList()).toEqual(
    genericRows.filter((game) => game.id !== genericGames[1].id),
  );
});

it("keeps the oldest-created Game when it finishes last and viewing does not refresh retention", async () => {
  const players = await createPlayers();
  const clock = vi.spyOn(Date, "now").mockReturnValue(1);
  const longRunning = await createGame(players);
  const completedGames: ActiveGame[] = [];
  for (let index = 0; index < 20; index++) {
    clock.mockReturnValue(index + 10);
    const game = await createGame(players);
    await finishGame(game);
    completedGames.push(game);
  }
  const oldestCompleted = completedGames[0];
  const beforeViewing = await gamesApi.getById(oldestCompleted.id);
  clock.mockReturnValue(100);
  await gamesApi.getAll();
  await gamesApi.getActive();
  await gamesApi.getById(oldestCompleted.id);
  await roundsApi.getByGameId(oldestCompleted.id);
  closeDB();
  expect(await gamesApi.getById(oldestCompleted.id)).toEqual(beforeViewing);

  clock.mockReturnValue(200);
  const result = await finishGame(longRunning);
  expect(result.outcome).toBe("gameCompleted");
  closeDB();
  expect(await gamesApi.getById(oldestCompleted.id)).toBeUndefined();
  expect(await gamesApi.getById(longRunning.id)).toMatchObject({
    status: "completed",
    createdAt: 1,
    completedAt: 200,
  });
  expect((await gamesApi.getAll()).map((game) => game.id).sort()).toEqual(
    [longRunning.id, ...completedGames.slice(1).map((game) => game.id)].sort(),
  );
  if (result.outcome !== "gameCompleted") throw new Error("Expected completion");
  expect(await gamesApi.getById(longRunning.id)).toEqual(result.completedGame);
});

it.each([
  100, 50,
])("retains generic completion order across reloads and reads when the latest clock is %s", async (latestTime) => {
  const players = await createPlayers();
  const clock = vi.spyOn(Date, "now").mockReturnValue(1);
  const longRunning = await createGenericGame(players);
  await addGenericRound(longRunning);
  const completedIds: string[] = [];
  clock.mockReturnValue(100);
  for (let index = 0; index < 20; index++) {
    const game = await createGenericGame(players);
    await addGenericRound(game);
    await genericGamesApi.finish(game.id);
    completedIds.push(game.id);
    closeDB();
  }
  const first = await genericGamesApi.getById(completedIds[0]);
  clock.mockReturnValue(1000);
  await genericGamesApi.getDetail(completedIds[0]);
  await genericGamesApi.getScoreboard(completedIds[0]);
  await genericGamesApi.getList();
  await genericGamesApi.getActiveViews();
  await genericRoundsApi.getByGameId(completedIds[0]);
  closeDB();
  expect(await genericGamesApi.getById(completedIds[0])).toEqual(first);

  clock.mockReturnValue(latestTime);
  const completed = await genericGamesApi.finish(longRunning.id);
  closeDB();
  expect(await genericGamesApi.getById(completedIds[0])).toBeUndefined();
  expect(await genericGamesApi.getById(longRunning.id)).toEqual(completed);
  expect(completed).toMatchObject({
    status: "completed",
    createdAt: 1,
    completedAt: latestTime,
    lastActivityAt: latestTime,
  });
  expect((await genericGamesApi.getList()).map((game) => game.id).sort()).toEqual(
    [longRunning.id, ...completedIds.slice(1)].sort(),
  );
});

it("retains the latest completion even if the device clock moves backwards", async () => {
  const players = await createPlayers();
  const clock = vi.spyOn(Date, "now");
  const earlierIds: string[] = [];
  for (let index = 0; index < 20; index++) {
    clock.mockReturnValue(100 + index);
    const game = await createGame(players);
    await finishGame(game);
    earlierIds.push(game.id);
  }
  closeDB();
  clock.mockReturnValue(50);
  const latest = await createGame(players);
  await finishGame(latest);

  closeDB();
  expect(await gamesApi.getById(earlierIds[0])).toBeUndefined();
  expect(await gamesApi.getById(latest.id)).toMatchObject({
    status: "completed",
    completedAt: 50,
    lastActivityAt: 50,
  });
  expect((await gamesApi.getAll()).map((game) => game.id).sort()).toEqual(
    [latest.id, ...earlierIds.slice(1)].sort(),
  );
});

it.each([
  "result",
  "cleanup",
] as const)("rolls back generic completion and retention together when the %s write fails", async (failurePoint) => {
  const players = await createPlayers();
  const phase = await createTemporaryPhase();
  const phaseGame = await createGame(players, {
    id: "phase-owner",
    type: "temporary",
    name: "Phase-owned",
    phases: [phase.id],
  });
  await finishGame(phaseGame);
  const phaseBefore = await gamesApi.getById(phaseGame.id);
  const phaseRoundsBefore = await roundsApi.getByGameId(phaseGame.id);
  const completedIds: string[] = [];
  for (let index = 0; index < 20; index++) {
    const game = await createGenericGame(players);
    await addGenericRound(game);
    await genericGamesApi.finish(game.id);
    completedIds.push(game.id);
  }
  const pending = await createGenericGame(players);
  const unplayedList = await genericGamesApi.getList();
  await expect(genericGamesApi.finish(pending.id)).rejects.toThrow("at least one saved Round");
  expect(await genericGamesApi.getList()).toEqual(unplayedList);
  await addGenericRound(pending);
  const ids = [...completedIds, pending.id];
  const gamesBefore = await Promise.all(ids.map((id) => genericGamesApi.getById(id)));
  const roundsBefore = await Promise.all(ids.map((id) => genericRoundsApi.getByGameId(id)));
  const listBefore = await genericGamesApi.getList();
  const put = IDBObjectStore.prototype.put;
  const remove = IDBObjectStore.prototype.delete;
  const failure =
    failurePoint === "result"
      ? vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (
          this: IDBObjectStore,
          value: unknown,
          key?: IDBValidKey,
        ) {
          if (this.name === "games") {
            throw new DOMException("Result write failed", "QuotaExceededError");
          }
          return put.call(this, value, key);
        })
      : vi.spyOn(IDBObjectStore.prototype, "delete").mockImplementation(function (
          this: IDBObjectStore,
          key: IDBValidKey | IDBKeyRange,
        ) {
          if (this.name === "games" && key === completedIds[0]) {
            throw new DOMException("Retention cleanup failed", "UnknownError");
          }
          return remove.call(this, key);
        });
  try {
    await expect(genericGamesApi.finish(pending.id)).rejects.toThrow(
      failurePoint === "result" ? "Result write failed" : "Retention cleanup failed",
    );
  } finally {
    failure.mockRestore();
  }
  closeDB();
  expect(await Promise.all(ids.map((id) => genericGamesApi.getById(id)))).toEqual(gamesBefore);
  expect(await Promise.all(ids.map((id) => genericRoundsApi.getByGameId(id)))).toEqual(
    roundsBefore,
  );
  expect(await genericGamesApi.getList()).toEqual(listBefore);
  expect(await gamesApi.getById(phaseGame.id)).toEqual(phaseBefore);
  expect(await roundsApi.getByGameId(phaseGame.id)).toEqual(phaseRoundsBefore);
  expect(await phasesApi.getById(phase.id)).toEqual(phase);
  expect(await playersApi.getAll()).toEqual(players);
  await expect(playersApi.delete(players[0].id)).rejects.toThrow("Active Game");

  await genericGamesApi.finish(pending.id);
  closeDB();
  expect(await genericGamesApi.getById(completedIds[0])).toBeUndefined();
  expect(await genericGamesApi.getById(pending.id)).toMatchObject({
    status: "completed",
    winnerIds: [players[0].id],
    playerSnapshots: players.map(({ id, name, color }) => ({ id, name, color })),
  });
  expect(await genericRoundsApi.getByGameId(pending.id)).toHaveLength(1);
  expect(await gamesApi.getById(phaseGame.id)).toEqual(phaseBefore);
  expect(await phasesApi.getById(phase.id)).toEqual(phase);
});

it.each([
  "delete",
  "evict",
] as const)("cleans only owned temporary data when Games %s", async (method) => {
  const players = await createPlayers();
  const owned = await createTemporaryPhase();
  const shared = await createTemporaryPhase();
  const catalogPhase = await createTemporaryPhase();
  const unrelated = await createTemporaryPhase();
  const saved = await phasesApi.create({
    type: "saved",
    requirements: [{ type: "run", count: 4, isSameColor: false, quantity: 1 }],
  });
  const savedSet = await phaseSetsApi.create({
    type: "saved",
    name: "Reusable",
    phases: [catalogPhase.id],
  });
  const builtIn = await phasesApi.getById("phase-1");
  const game = await createGame(players, {
    ...savedSet,
    type: "temporary",
    phases: [owned.id, shared.id, catalogPhase.id, saved.id, "phase-1"],
  });
  const other = await createGame(players, {
    id: "other-set",
    type: "temporary",
    name: "Other Game",
    phases: [shared.id],
  });
  await finishGame(game);

  await removeGame(game, players, method);

  closeDB();
  expect(await gamesApi.getById(game.id)).toBeUndefined();
  expect(await roundsApi.getByGameId(game.id)).toEqual([]);
  expect(await phasesApi.getById(owned.id)).toBeUndefined();
  expect(await phasesApi.getById(shared.id)).toEqual(shared);
  expect(await phasesApi.getById(catalogPhase.id)).toEqual(catalogPhase);
  expect(await phasesApi.getById(unrelated.id)).toEqual(unrelated);
  expect(await phasesApi.getById(saved.id)).toEqual(saved);
  expect(await phasesApi.getById("phase-1")).toEqual(builtIn);
  expect(await phaseSetsApi.getById(savedSet.id)).toEqual(savedSet);
  expect(await gamesApi.getById(other.id)).toEqual(other);
  expect(await playersApi.getAll()).toEqual(players);
});

it.each([
  "delete",
  "evict",
] as const)("removes an owned persisted Temporary Phase Set when Games %s", async (method) => {
  const players = await createPlayers();
  const ownedPhase = await createTemporaryPhase();
  const persistedOnlyPhase = await createTemporaryPhase();
  const phaseSet: TemporaryPhaseSet = {
    id: "owned-temporary-set",
    type: "temporary",
    name: "Owned",
    phases: [ownedPhase.id, persistedOnlyPhase.id],
  };
  await persistTemporarySet(phaseSet);
  const game = await createGame(players, { ...phaseSet, phases: [ownedPhase.id] });
  await finishGame(game);

  await removeGame(game, players, method);

  closeDB();
  expect(await gamesApi.getById(game.id)).toBeUndefined();
  expect(await roundsApi.getByGameId(game.id)).toEqual([]);
  expect(await phaseSetsApi.getById(phaseSet.id)).toBeUndefined();
  expect(await phasesApi.getById(ownedPhase.id)).toBeUndefined();
  expect(await phasesApi.getById(persistedOnlyPhase.id)).toBeUndefined();
});

it.each([
  "delete",
  "evict",
] as const)("preserves a persisted Temporary Phase Set still used by another Game during %s", async (method) => {
  const players = await createPlayers();
  const sharedPhase = await createTemporaryPhase();
  const phaseSet: TemporaryPhaseSet = {
    id: "shared-temporary-set",
    type: "temporary",
    name: "Shared",
    phases: [sharedPhase.id],
  };
  await persistTemporarySet(phaseSet);
  const game = await createGame(players, phaseSet);
  const other = await createGame(players, { ...phaseSet, phases: ["phase-1"] });
  await finishGame(game);

  await removeGame(game, players, method);

  closeDB();
  expect(await gamesApi.getById(game.id)).toBeUndefined();
  expect(await phaseSetsApi.getById(phaseSet.id)).toEqual(phaseSet);
  expect(await phasesApi.getById(sharedPhase.id)).toEqual(sharedPhase);
  expect(await gamesApi.getById(other.id)).toEqual(other);

  await gamesApi.delete(other.id);
  expect(await phaseSetsApi.getById(phaseSet.id)).toBeUndefined();
  expect(await phasesApi.getById(sharedPhase.id)).toBeUndefined();
});

it.each([
  "delete",
  "evict",
  "finish",
] as const)("rolls back every write when Phase cleanup fails during %s", async (method) => {
  const players = await createPlayers();
  const firstPhase = await createTemporaryPhase();
  const secondPhase = await createTemporaryPhase();
  const phaseSet: TemporaryPhaseSet = {
    id: "rollback-set",
    type: "temporary",
    name: "Rollback",
    phases: [firstPhase.id, secondPhase.id],
  };
  await persistTemporarySet(phaseSet);
  const victim = await createGame(players, phaseSet);
  await finishGame(victim);
  for (let index = 0; index < 19; index++) {
    await finishGame(await createGame(players));
  }
  const pending = await createGame(players, {
    id: "pending-set",
    type: "temporary",
    name: "Pending",
    phases: ["phase-1", "phase-2"],
  });
  await addRound(pending);
  const gamesBefore = await gamesApi.getAll();
  const roundsBefore = await Promise.all(gamesBefore.map((game) => roundsApi.getByGameId(game.id)));
  const operation = () =>
    method === "delete"
      ? gamesApi.delete(victim.id)
      : method === "finish"
        ? gamesApi.finish(pending.id)
        : addRound(pending);
  const remove = IDBObjectStore.prototype.delete;
  const failure = vi.spyOn(IDBObjectStore.prototype, "delete").mockImplementation(function (
    this: IDBObjectStore,
    key: IDBValidKey | IDBKeyRange,
  ) {
    if (this.name === "customPhases" && key === secondPhase.id) {
      throw new DOMException("Phase cleanup failed", "QuotaExceededError");
    }
    return remove.call(this, key);
  });
  try {
    await expect(operation()).rejects.toThrow("Phase cleanup failed");
  } finally {
    failure.mockRestore();
  }

  closeDB();
  expect(await gamesApi.getAll()).toEqual(gamesBefore);
  expect(await Promise.all(gamesBefore.map((game) => roundsApi.getByGameId(game.id)))).toEqual(
    roundsBefore,
  );
  expect(await phaseSetsApi.getById(phaseSet.id)).toEqual(phaseSet);
  expect(await phasesApi.getById(firstPhase.id)).toEqual(firstPhase);
  expect(await phasesApi.getById(secondPhase.id)).toEqual(secondPhase);
  expect(await playersApi.getAll()).toEqual(players);

  await operation();
  closeDB();
  expect(await gamesApi.getById(victim.id)).toBeUndefined();
  expect(await roundsApi.getByGameId(victim.id)).toEqual([]);
  expect(await phaseSetsApi.getById(phaseSet.id)).toBeUndefined();
  expect(await phasesApi.getById(firstPhase.id)).toBeUndefined();
  expect(await phasesApi.getById(secondPhase.id)).toBeUndefined();
  if (method !== "delete") {
    expect(await gamesApi.getById(pending.id)).toMatchObject({
      status: "completed",
      winnerIds: [players[0].id],
      playerSnapshots: players.map(({ id, name, color }) => ({ id, name, color })),
    });
    expect(await roundsApi.getByGameId(pending.id)).toHaveLength(method === "finish" ? 1 : 2);
  }
});

async function createPlayers() {
  return [
    await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 }),
    await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 }),
  ];
}

function createGenericGame(players: Player[]) {
  return genericGamesApi.create({
    players: players.map((player) => player.id),
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
  });
}

function addGenericRound(game: ActiveGenericGame) {
  return genericRoundsApi.add({
    mode: "points",
    gameId: game.id,
    scores: game.players.map((playerId, index) => ({ playerId, points: index === 0 ? "10" : "0" })),
  });
}

function createGame(
  players: Player[],
  phaseSet: TemporaryPhaseSet = {
    id: "short",
    type: "temporary",
    name: "Short",
    phases: ["phase-1"],
  },
) {
  return gamesApi.create({
    players: players.map((player) => player.id),
    phaseSet,
    settings: { tiebreaker: "lowestPoints", roundSkipPenalty: 100, sitOutPenalty: 0 },
  });
}

async function finishGame(game: ActiveGame) {
  for (let round = 1; round < game.phaseSet.phases.length; round++) {
    await addRound(game);
  }
  return addRound(game);
}

function addRound(game: ActiveGame) {
  return roundsApi.add({
    gameId: game.id,
    roundWinnerId: game.players[0],
    scores: [
      { playerId: game.players[0], phaseStatus: "completed", score: 0 },
      { playerId: game.players[1], phaseStatus: "failed", score: 10 },
    ],
  });
}

async function removeGame(game: ActiveGame, players: Player[], method: "delete" | "evict") {
  if (method === "delete") {
    await gamesApi.delete(game.id);
    return;
  }
  for (let index = 0; index < 20; index++) {
    await finishGame(await createGame(players));
  }
}

function createTemporaryPhase() {
  return phasesApi.create({
    type: "temporary",
    requirements: [{ type: "set", count: 3, isSameColor: false, quantity: 1 }],
  });
}

async function persistTemporarySet(phaseSet: TemporaryPhaseSet) {
  // The schema permits historical temporary sets, but the catalog API creates saved sets only.
  const db = await getDB();
  await db.put("customPhaseSets", phaseSet);
}

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}
