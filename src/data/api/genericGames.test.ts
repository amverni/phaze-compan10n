import "fake-indexeddb/auto";
import { QueryClient } from "@tanstack/react-query";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
  CompletedGenericGame,
  CreateGenericGameInput,
  GameId,
  GenericPointsSettings,
  GenericRound,
  PlayerId,
  Round,
} from "../../types";
import { closeDB, getDB } from "../db";
import { gameDetailOptions } from "../hooks/useGames";
import {
  activeGenericGamesOptions,
  genericGameDetailOptions,
  genericGameKeys,
} from "../hooks/useGenericGames";
import { getGamePlayers } from "./gameResults";
import { gamesApi } from "./games";
import { genericGamesApi } from "./genericGames";
import { genericRoundsApi } from "./genericRounds";
import { phasesApi } from "./phases";
import { playersApi } from "./players";
import { roundsApi } from "./rounds";
import { deriveStandings } from "./standings";

beforeEach(resetDatabase);
afterEach(resetDatabase);

it("creates and reopens a solo Points Game without Phase 10 fields", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const game = await genericGamesApi.create({
    players: [amy.id],
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
  });
  expect(game).toMatchObject({
    scorekeeper: "generic",
    status: "active",
    players: [amy.id],
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
    createdAt: expect.any(Number),
    lastActivityAt: expect.any(Number),
  });
  expect(game).not.toHaveProperty("phaseSet");
  expect(game).not.toHaveProperty("activePlayers");
  closeDB();
  expect(await genericGamesApi.getById(game.id)).toEqual(game);
  expect(await genericGamesApi.getDetail(game.id)).toEqual({
    game,
    players: [amy],
  });
});

it("snapshots creation order and Low wins rules before asynchronous work", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 1 });
  const input: CreateGenericGameInput = {
    players: [bob.id, amy.id],
    settings: pointsSettings("low"),
  };
  const creating = genericGamesApi.create(input);
  input.players.reverse();
  input.settings.pointsDirection = "high";
  const game = await creating;
  expect(game.players).toEqual([bob.id, amy.id]);
  expect(game.settings.pointsDirection).toBe("low");
  game.players.reverse();
  game.settings.pointsDirection = "high";
  closeDB();
  expect(await genericGamesApi.getDetail(game.id)).toMatchObject({
    game: { players: [bob.id, amy.id], settings: pointsSettings("low") },
    players: [bob, amy],
  });
});

it("rejects zero Players and duplicate Players", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  await expect(genericGamesApi.create({ players: [], settings: pointsSettings() })).rejects.toThrow(
    "at least one Player",
  );
  await expect(
    genericGamesApi.create({ players: [amy.id, amy.id], settings: pointsSettings() }),
  ).rejects.toThrow("unique");
});

it("rejects a missing Player without saving a partial Game", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  await expect(
    genericGamesApi.create({ players: [amy.id, "missing"], settings: pointsSettings() }),
  ).rejects.toThrow("Player no longer exists");
  expect(await genericGamesApi.getActive()).toEqual([]);
});

it.each([
  { mode: "singleRoundWinner" },
  { mode: "passFail" },
  { mode: "unknown" },
  { pointsDirection: "sideways" },
  { pointsDirection: undefined },
  { tiebreaker: { direction: "high" } },
  { tiebreaker: undefined },
  { dealer: true },
  { dealer: undefined },
])("rejects unsupported Points settings: %j", async (unsupported) => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const settings = Object.assign(pointsSettings(), unsupported);
  await expect(genericGamesApi.create({ players: [amy.id], settings })).rejects.toThrow("settings");
  expect(await genericGamesApi.getActive()).toEqual([]);
});

it("allows a large roster without an arbitrary maximum", async () => {
  const players = await Promise.all(
    Array.from({ length: 30 }, (_, index) =>
      playersApi.create({ name: `Player ${index}`, color: "Jam", isFavorite: 0 }),
    ),
  );
  const ids = players.map((player) => player.id);
  const game = await genericGamesApi.create({ players: ids, settings: pointsSettings() });
  expect((await genericGamesApi.getDetail(game.id))?.players.map((player) => player.id)).toEqual(
    ids,
  );
});

it("returns missing and wrong-owner detail results without crossing experiences", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 });
  const phase = await createPhaseGame([amy.id, bob.id]);
  const generic = await genericGamesApi.create({
    players: [amy.id],
    settings: pointsSettings(),
  });
  expect(await genericGamesApi.getById(phase.id)).toBeUndefined();
  expect(await genericGamesApi.getDetail(phase.id)).toBeNull();
  expect(await genericGamesApi.getById("missing")).toBeUndefined();
  expect(await genericGamesApi.getDetail("missing")).toBeNull();
  expect(await gamesApi.getById(generic.id)).toBeUndefined();
  expect(await gamesApi.getAll()).toEqual([phase]);
  expect(await gamesApi.getActive()).toEqual([phase]);
  expect(await genericGamesApi.getActive()).toEqual([generic]);
  expect(await genericGamesApi.getActiveViews()).toEqual([{ game: generic, players: [amy] }]);
});

it("lists only Active generic Games ordered by activity then creation time", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const first = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  const second = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  const third = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  const completed = await genericGamesApi.create({
    players: [amy.id],
    settings: pointsSettings(),
  });
  const db = await getDB();
  await db.put("games", { ...first, createdAt: 10, lastActivityAt: 40 });
  await db.put("games", { ...second, createdAt: 30, lastActivityAt: 30 });
  await db.put("games", { ...third, createdAt: 20, lastActivityAt: 40 });
  await db.put("games", {
    ...completed,
    status: "completed",
    completionType: "manual",
    completedAt: 100,
    lastActivityAt: 100,
    winnerIds: [amy.id],
    playerSnapshots: [amy],
  });
  closeDB();
  expect((await genericGamesApi.getActive()).map((game) => game.id)).toEqual([
    third.id,
    first.id,
    second.id,
  ]);
  expect((await genericGamesApi.getActiveViews()).map(({ game }) => game.id)).toEqual([
    third.id,
    first.id,
    second.id,
  ]);
});

it("reports missing Player data instead of a successful incomplete scoreboard", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const game = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  const db = await getDB();
  await db.delete("players", amy.id);
  await expect(genericGamesApi.getDetail(game.id)).rejects.toThrow("Player no longer exists");
  await expect(genericGamesApi.getActiveViews()).rejects.toThrow("Player no longer exists");
});

it("prevents every Phase Game write from changing a Generic Game", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const generic = await genericGamesApi.create({
    players: [amy.id],
    settings: pointsSettings(),
  });
  await expect(gamesApi.addPhase(generic.id, "phase-1")).rejects.toThrow("not found");
  await expect(gamesApi.removePhase(generic.id, "phase-1")).rejects.toThrow("not found");
  await expect(gamesApi.complete(generic.id, amy.id)).rejects.toThrow("not found");
  await expect(gamesApi.delete(generic.id)).rejects.toThrow("another Scorekeeper");
  await expect(
    roundsApi.add({
      gameId: generic.id,
      scores: [{ playerId: amy.id, score: 0, phaseStatus: "completed" }],
      roundWinnerId: amy.id,
    }),
  ).rejects.toThrow("not found");
  await expect(roundsApi.edit(generic.id, 1, amy.id, { score: 5 })).rejects.toThrow("not found");
  await expect(roundsApi.delete(generic.id, 1)).rejects.toThrow("not found");
  await expect(roundsApi.deleteByGameId(generic.id)).rejects.toThrow("not found");
  expect(await genericGamesApi.getById(generic.id)).toEqual(generic);
  expect(await genericRoundsApi.getByGameId(generic.id)).toEqual([]);
});

it("scopes round reads to both Game and Round ownership", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 });
  const phase = await createPhaseGame([amy.id, bob.id]);
  const generic = await genericGamesApi.create({
    players: [amy.id],
    settings: pointsSettings(),
  });
  const db = await getDB();
  const phaseRound = makePhaseRound(phase.id, amy.id);
  const genericRound = makeGenericRound(generic.id, amy.id);
  await db.put("rounds", phaseRound);
  await db.put("rounds", genericRound);
  await db.put("rounds", { ...phaseRound, gameId: generic.id, roundNumber: 2 });
  await db.put("rounds", { ...genericRound, gameId: phase.id, roundNumber: 2 });
  await db.put("rounds", { ...phaseRound, gameId: "missing" });
  await db.put("rounds", { ...genericRound, gameId: "missing", roundNumber: 2 });
  expect(await roundsApi.getByGameId(generic.id)).toEqual([]);
  expect(await roundsApi.hasRounds(generic.id)).toBe(false);
  expect(await genericRoundsApi.getByGameId(phase.id)).toEqual([]);
  expect(await genericRoundsApi.hasRounds(phase.id)).toBe(false);
  expect(await roundsApi.getByGameId("missing")).toEqual([]);
  expect(await genericRoundsApi.getByGameId("missing")).toEqual([]);
  expect(await roundsApi.getByGameId(phase.id)).toEqual([phaseRound]);
  expect(await genericRoundsApi.getByGameId(generic.id)).toEqual([genericRound]);
});

it("rejects Phase mutation of wrong-owner Round data even under a Phase Game id", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 });
  const phase = await createPhaseGame([amy.id, bob.id]);
  const db = await getDB();
  await db.put("rounds", makeGenericRound(phase.id, amy.id));
  await expect(
    roundsApi.add({
      gameId: phase.id,
      scores: [{ playerId: amy.id, score: 0, phaseStatus: "completed" }],
      roundWinnerId: amy.id,
    }),
  ).rejects.toThrow("another Scorekeeper");
  await expect(roundsApi.edit(phase.id, 1, amy.id, { score: 5 })).rejects.toThrow(
    "another Scorekeeper",
  );
  await expect(roundsApi.delete(phase.id, 1)).rejects.toThrow("another Scorekeeper");
  await expect(roundsApi.deleteByGameId(phase.id)).rejects.toThrow("another Scorekeeper");
  await expect(gamesApi.complete(phase.id, amy.id)).rejects.toThrow("another Scorekeeper");
});

it("rejects Generic ownership in the public Phase Standings boundary", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const generic = await genericGamesApi.create({
    players: [amy.id],
    settings: pointsSettings(),
  });
  expect(() =>
    // @ts-expect-error The Phase identity boundary must also reject a wrong-scorekeeper Game.
    getGamePlayers(generic, [amy]),
  ).toThrow("Phase 10");
  expect(() =>
    // @ts-expect-error Simulate wrong-scorekeeper data reaching the public runtime boundary.
    deriveStandings({ game: generic, players: [amy], rounds: [] }),
  ).toThrow("Phase 10");
  const phase = await createPhaseGame([amy.id]);
  expect(() =>
    deriveStandings({
      game: phase,
      players: [amy],
      // @ts-expect-error Simulate wrong-scorekeeper Round input.
      rounds: [makeGenericRound(phase.id, amy.id)],
    }),
  ).toThrow("Phase 10");
});

it("keeps future Completed Generic Game identities independent of saved Players", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 });
  const active = await genericGamesApi.create({
    players: [bob.id, amy.id],
    settings: pointsSettings("low"),
  });
  const completed: CompletedGenericGame = {
    ...active,
    status: "completed",
    completionType: "manual",
    completedAt: 100,
    winnerIds: [amy.id],
    playerSnapshots: [amy, bob].map(({ id, name, color }) => ({ id, name, color })),
  };
  const db = await getDB();
  await db.put("rounds", makeGenericRound(active.id, amy.id));
  await db.put("games", completed);
  await playersApi.update(amy.id, { name: "Amelia", color: "Ocean" });
  await playersApi.delete(bob.id);
  await playersApi.delete(amy.id);
  closeDB();
  expect(await genericGamesApi.getActiveViews()).toEqual([]);
  expect(await genericGamesApi.getDetail(active.id)).toEqual({
    game: completed,
    players: [
      { id: bob.id, name: "Bob", color: "Ocean" },
      { id: amy.id, name: "Amy", color: "Jam" },
    ],
  });
});

it("guards generic deletion and atomically cleans only its Game and Rounds", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 });
  const phase = await createPhaseGame([amy.id, bob.id]);
  const temporary = await phasesApi.create({
    type: "temporary",
    requirements: [{ type: "set", count: 3, quantity: 1, isSameColor: false }],
  });
  await gamesApi.addPhase(phase.id, temporary.id);
  const generic = await genericGamesApi.create({
    players: [amy.id],
    settings: pointsSettings(),
  });
  const db = await getDB();
  await db.put("rounds", makeGenericRound(generic.id, amy.id));
  await db.put("rounds", makePhaseRound(phase.id, amy.id));
  await expect(genericGamesApi.delete(phase.id)).rejects.toThrow("another Scorekeeper");
  expect(await roundsApi.getByGameId(phase.id)).toHaveLength(1);
  await genericGamesApi.delete(generic.id);
  expect(await genericGamesApi.getDetail(generic.id)).toBeNull();
  expect(await genericGamesApi.getActive()).toEqual([]);
  // Reusing the deleted id exposes dangling rounds through the public read boundary.
  await db.put("games", generic);
  expect(await genericRoundsApi.getByGameId(generic.id)).toEqual([]);
  await genericGamesApi.delete(generic.id);
  expect(await phasesApi.getById(temporary.id)).toEqual(temporary);
  expect(await roundsApi.getByGameId(phase.id)).toHaveLength(1);
  await expect(genericGamesApi.delete("missing")).resolves.toBeUndefined();
  await gamesApi.delete(phase.id);
  expect(await phasesApi.getById(temporary.id)).toBeUndefined();
  expect(await playersApi.getAll()).toEqual([amy, bob]);
});

it("keeps Phase temporary cleanup safe while Generic Games remain", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const phase = await createPhaseGame([amy.id]);
  const temporary = await phasesApi.create({
    type: "temporary",
    requirements: [{ type: "set", count: 3, quantity: 1, isSameColor: false }],
  });
  await gamesApi.addPhase(phase.id, temporary.id);
  const generic = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  await gamesApi.delete(phase.id);
  expect(await phasesApi.getById(temporary.id)).toBeUndefined();
  expect(await genericGamesApi.getById(generic.id)).toEqual(generic);
});

it("blocks shared Player deletion until both scorekeepers release their Active references", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const phase = await createPhaseGame([amy.id]);
  const generic = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  await expect(playersApi.delete(amy.id)).rejects.toThrow("Active Game");
  await gamesApi.delete(phase.id);
  await expect(playersApi.delete(amy.id)).rejects.toThrow("Active Game");
  await genericGamesApi.delete(generic.id);
  await playersApi.delete(amy.id);
  expect(await playersApi.getById(amy.id)).toBeUndefined();
});

it("reflects shared Player edits and Favorites in both experience views", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const phase = await createPhaseGame([amy.id]);
  const generic = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  const edited = await playersApi.update(amy.id, {
    name: "Amelia",
    color: "Ocean",
    isFavorite: 1,
  });
  closeDB();
  expect(await genericGamesApi.getDetail(generic.id)).toEqual({
    game: generic,
    players: [edited],
  });
  expect(await genericGamesApi.getActiveViews()).toEqual([{ game: generic, players: [edited] }]);
  expect(
    deriveStandings({ game: phase, players: await playersApi.getAll(), rounds: [] })
      .includedPlayers,
  ).toEqual([edited]);
  expect(await playersApi.getAll({ isFavorite: 1 })).toEqual([edited]);
});

it.each([
  true,
  false,
])("serializes generic creation against shared Player deletion (create first: %s)", async (createFirst) => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const create = () => genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  const remove = () => playersApi.delete(amy.id);
  const results = await Promise.allSettled(
    createFirst ? [create(), remove()] : [remove(), create()],
  );
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  const remaining = await playersApi.getById(amy.id);
  const games = await genericGamesApi.getActiveViews();
  expect(games).toHaveLength(remaining ? 1 : 0);
  if (remaining) expect(games[0].players).toEqual([remaining]);
});

it("rolls back generic Game and Round deletion when cleanup fails", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const game = await genericGamesApi.create({ players: [amy.id], settings: pointsSettings() });
  const round = makeGenericRound(game.id, amy.id);
  await (await getDB()).put("rounds", round);
  const remove = IDBObjectStore.prototype.delete;
  const failure = vi.spyOn(IDBObjectStore.prototype, "delete").mockImplementation(function (
    this: IDBObjectStore,
    key: IDBValidKey | IDBKeyRange,
  ) {
    if (this.name === "games") throw new DOMException("Cleanup failed", "UnknownError");
    return remove.call(this, key);
  });
  try {
    await expect(genericGamesApi.delete(game.id)).rejects.toThrow("Cleanup failed");
  } finally {
    failure.mockRestore();
  }
  closeDB();
  expect(await genericGamesApi.getById(game.id)).toEqual(game);
  expect(await genericRoundsApi.getByGameId(game.id)).toEqual([round]);
  await expect(playersApi.delete(amy.id)).rejects.toThrow("Active Game");
});

it("uses scoped generic query keys with explicit missing and wrong-owner detail data", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  try {
    const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
    const phase = await createPhaseGame([amy.id]);
    const generic = await genericGamesApi.create({
      players: [amy.id],
      settings: pointsSettings(),
    });
    expect(genericGameKeys.all).toEqual(["games", "generic"]);
    expect(genericGameDetailOptions(generic.id).queryKey).toEqual([
      "games",
      "generic",
      "detail",
      generic.id,
    ]);
    expect(await client.fetchQuery(genericGameDetailOptions(generic.id))).toEqual({
      game: generic,
      players: [amy],
    });
    expect(await client.fetchQuery(activeGenericGamesOptions())).toEqual([
      { game: generic, players: [amy] },
    ]);
    expect(await client.fetchQuery(genericGameDetailOptions(phase.id))).toBeNull();
    expect(await client.fetchQuery(genericGameDetailOptions("missing"))).toBeNull();
    expect(await client.fetchQuery(gameDetailOptions(generic.id))).toBeNull();
    expect(await client.fetchQuery(gameDetailOptions("missing"))).toBeNull();
  } finally {
    client.clear();
  }
});

function makeGenericRound(gameId: GameId, playerId: PlayerId): GenericRound {
  return {
    scorekeeper: "generic",
    gameId,
    roundNumber: 1,
    mode: "points",
    scores: [{ playerId, points: 0 }],
  };
}

function makePhaseRound(gameId: GameId, playerId: PlayerId): Round {
  return {
    scorekeeper: "phase10",
    gameId,
    roundNumber: 1,
    scores: [{ playerId, score: 0, currentPhase: 1, phaseStatus: "completed" }],
    roundWinnerId: playerId,
  };
}

function pointsSettings(direction: "high" | "low" = "high"): GenericPointsSettings {
  return { mode: "points", pointsDirection: direction, tiebreaker: null, dealer: false };
}

function createPhaseGame(players: PlayerId[]) {
  return gamesApi.create({
    players,
    phaseSet: {
      id: "phase-set",
      type: "temporary",
      name: "Two phases",
      phases: ["phase-1", "phase-2"],
    },
    settings: { tiebreaker: "lowestPoints", roundSkipPenalty: 100, sitOutPenalty: 0 },
  });
}

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}
