import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
  ActiveGame,
  CompletedGenericGame,
  GenericRound,
  Player,
  TemporaryPhaseSet,
} from "../../types";
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

it("keeps Generic Games and their Rounds outside Phase completion retention and listing", async () => {
  const players = await createPlayers();
  const input = {
    players: players.map((player) => player.id),
    settings: {
      mode: "points",
      pointsDirection: "high",
      tiebreaker: null,
      dealer: false,
    },
  } as const;
  const active = await genericGamesApi.create(input);
  const generic = await genericGamesApi.create(input);
  const completed: CompletedGenericGame = {
    ...generic,
    status: "completed",
    completedAt: 1,
    completionType: "manual",
    winnerIds: [players[0].id],
    playerSnapshots: players.map(({ id, name, color }) => ({ id, name, color })),
  };
  const round: GenericRound = {
    scorekeeper: "generic",
    gameId: generic.id,
    roundNumber: 1,
    mode: "points",
    scores: [
      { playerId: players[0].id, points: 10 },
      { playerId: players[1].id, points: 0 },
    ],
  };
  // Generic finalization is a later slice; seed its supported persisted result shape.
  const db = await getDB();
  const tx = db.transaction(["games", "rounds"], "readwrite");
  await tx.objectStore("games").put(completed);
  await tx.objectStore("rounds").put(round);
  await tx.done;
  for (let index = 0; index < 21; index++) {
    await finishGame(await createGame(players));
  }

  closeDB();
  expect(await genericGamesApi.getById(active.id)).toEqual(active);
  expect(await genericGamesApi.getById(generic.id)).toEqual(completed);
  expect(await genericRoundsApi.getByGameId(generic.id)).toEqual([round]);
  const phaseRows = await gamesApi.getList();
  expect(phaseRows).toHaveLength(20);
  expect(phaseRows.some((game) => game.id === active.id || game.id === generic.id)).toBe(false);
  await genericGamesApi.delete(generic.id);
  expect(await genericRoundsApi.getByGameId(generic.id)).toEqual([]);
  expect(await gamesApi.getList()).toEqual(phaseRows);
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
