import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
  AddGenericPointsRoundInput,
  AddGenericRoundInput,
  GenericPointsSettings,
  GenericRound,
  GenericScoreDirection,
} from "../../types";
import { closeDB, getDB } from "../db";
import { genericGamesApi } from "./genericGames";
import { genericRoundsApi } from "./genericRounds";
import { playersApi } from "./players";

beforeEach(resetDatabase);
afterEach(async () => {
  vi.restoreAllMocks();
  await resetDatabase();
});

it.each([
  "high",
  "low",
] as const)("clones enabled Points Tiebreaker %s settings before async creation and persists fixed rules", async (direction) => {
  const player = await playersApi.create({ name: "Zed", color: "Jam", isFavorite: 0 });
  const settings: GenericPointsSettings = {
    mode: "points",
    pointsDirection: "low",
    tiebreaker: { direction },
    dealer: true,
  };
  const creating = genericGamesApi.create({ players: [player.id], settings });
  if (!settings.tiebreaker) throw new Error("Expected enabled Tiebreaker");
  settings.tiebreaker.direction = direction === "high" ? "low" : "high";
  settings.tiebreaker = null;
  const game = await creating;
  const expected = {
    mode: "points",
    pointsDirection: "low",
    tiebreaker: { direction },
    dealer: true,
  };
  expect(game.settings).toEqual(expected);
  if (!game.settings.tiebreaker) throw new Error("Expected enabled Tiebreaker");
  game.settings.tiebreaker.direction = direction === "high" ? "low" : "high";
  closeDB();
  expect((await genericGamesApi.getById(game.id))?.settings).toEqual(expected);
});

it("saves explicit signed Tiebreaker entries separately and reopens fixed-order running totals", async () => {
  const {
    game,
    players: [zed, amy],
  } = await createTiebreakerGame();
  const input: AddGenericPointsRoundInput = {
    mode: "points",
    gameId: game.id,
    scores: [
      { playerId: amy.id, points: "-12", tiebreaker: "0" },
      { playerId: zed.id, points: "0", tiebreaker: "-3" },
    ],
  };
  const saving = genericRoundsApi.add(input);
  input.scores[0].tiebreaker = "100";
  input.scores.length = 0;
  const first = await saving;
  expect(first.scores).toEqual([
    { playerId: zed.id, points: 0, tiebreaker: -3 },
    { playerId: amy.id, points: -12, tiebreaker: 0 },
  ]);
  const second = await genericRoundsApi.add({
    mode: "points",
    gameId: game.id,
    scores: [
      { playerId: zed.id, points: "+7", tiebreaker: "+9" },
      { playerId: amy.id, points: "2", tiebreaker: "-2" },
    ],
  });
  closeDB();
  expect(await genericRoundsApi.getByGameId(game.id)).toEqual([first, second]);
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    players: [
      { id: zed.id, totalPoints: 7, totalTiebreaker: 6 },
      { id: amy.id, totalPoints: -10, totalTiebreaker: -2 },
    ],
    rounds: [
      {
        scores: [
          { playerId: zed.id, points: 0, totalPoints: 0, tiebreaker: -3, totalTiebreaker: -3 },
          { playerId: amy.id, points: -12, totalPoints: -12, tiebreaker: 0, totalTiebreaker: 0 },
        ],
      },
      {
        scores: [
          { playerId: zed.id, points: 7, totalPoints: 7, tiebreaker: 9, totalTiebreaker: 6 },
          { playerId: amy.id, points: 2, totalPoints: -10, tiebreaker: -2, totalTiebreaker: -2 },
        ],
      },
    ],
    standings: [
      { player: { id: zed.id }, totalPoints: 7, totalTiebreaker: 6, place: 1 },
      { player: { id: amy.id }, totalPoints: -10, totalTiebreaker: -2, place: 2 },
    ],
  });
});

it("starts enabled Tiebreaker totals at zero without inventing Round entries", async () => {
  const { game, players } = await createTiebreakerGame();
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    players: players.map(({ id }) => ({ id, totalPoints: 0, totalTiebreaker: 0 })),
    rounds: [],
    standings: players.map(({ id }) => ({
      player: { id },
      totalPoints: 0,
      totalTiebreaker: 0,
      place: 1,
    })),
  });
});

it.each([
  undefined,
  null,
  0,
  "",
  " ",
  "+",
  "-",
  "1.5",
  "-1.5",
  "1.0",
  "9007199254740991.1",
  "9007199254740992",
  "9007199254740993",
  "-9007199254740992",
  "999999999999999999999999999999999999999",
  "1e3",
  "0x10",
  "NaN",
  "Infinity",
  "1 2",
  "1_000",
  "12abc",
  "--2",
  "−2",
  " 1",
  "1\n",
])("rejects missing, malformed, or non-exact Tiebreaker %j without partial Round or activity", async (tiebreaker) => {
  const {
    game,
    players: [zed, amy],
  } = await createTiebreakerGame();
  const input: AddGenericPointsRoundInput = {
    mode: "points",
    gameId: game.id,
    scores: [
      { playerId: zed.id, points: "0", tiebreaker: "0" },
      Object.assign({ playerId: amy.id, points: "2", tiebreaker: "0" }, { tiebreaker }),
    ],
  };
  const before = await genericGamesApi.getScoreboard(game.id);
  await expect(genericRoundsApi.add(input)).rejects.toThrow(/Tiebreaker/);
  closeDB();
  expect(await genericRoundsApi.getByGameId(game.id)).toEqual([]);
  expect(await genericGamesApi.getScoreboard(game.id)).toEqual(before);
  expect(await genericGamesApi.getById(game.id)).toEqual(game);
});

it.each([
  ["+0", 0],
  ["-0", 0],
  ["0007", 7],
  ["+9007199254740991", 9007199254740991],
  ["-9007199254740991", -9007199254740991],
] as const)("preserves explicit exact Tiebreaker %s", async (tiebreaker, expected) => {
  const {
    game,
    players: [zed],
  } = await createTiebreakerGame("high", "low", 1);
  await genericRoundsApi.add({
    mode: "points",
    gameId: game.id,
    scores: [{ playerId: zed.id, points: "2", tiebreaker }],
  });
  closeDB();
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    players: [{ id: zed.id, totalPoints: 2, totalTiebreaker: expected }],
    rounds: [{ scores: [{ tiebreaker: expected, totalTiebreaker: expected }] }],
  });
});

it.each([
  ["9007199254740991", "1"],
  ["-9007199254740991", "-1"],
  ["9007199254740991", "9007199254740991"],
])("rejects individually exact Tiebreakers whose sum overflows (%s + %s) atomically", async (first, next) => {
  const {
    game,
    players: [zed, amy],
  } = await createTiebreakerGame();
  vi.spyOn(Date, "now").mockReturnValue(100);
  const saved = await genericRoundsApi.add({
    mode: "points",
    gameId: game.id,
    scores: [
      { playerId: zed.id, points: "3", tiebreaker: "2" },
      { playerId: amy.id, points: "4", tiebreaker: first },
    ],
  });
  const before = await genericGamesApi.getScoreboard(game.id);
  vi.spyOn(Date, "now").mockReturnValue(200);
  await expect(
    genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [
        { playerId: zed.id, points: "4", tiebreaker: "3" },
        { playerId: amy.id, points: "5", tiebreaker: next },
      ],
    }),
  ).rejects.toThrow("Total Tiebreaker must be between -9007199254740991 and 9007199254740991.");
  closeDB();
  expect(await genericRoundsApi.getByGameId(game.id)).toEqual([saved]);
  expect(await genericGamesApi.getScoreboard(game.id)).toEqual(before);
  expect((await genericGamesApi.getById(game.id))?.lastActivityAt).toBe(100);
});

it.each([
  ["high", "high"],
  ["high", "low"],
  ["low", "high"],
  ["low", "low"],
] as const)("compares %s Points before %s Tiebreaker, preserving shared places and snapshotted wins", async (pointsDirection, direction) => {
  const {
    game,
    players: [zed, amy, bob, cam],
  } = await createTiebreakerGame(pointsDirection, direction, 4);
  const pointsSign = pointsDirection === "high" ? 1 : -1;
  const tiebreakerSign = direction === "high" ? 1 : -1;
  const first = [
    { playerId: zed.id, points: 7, tiebreaker: 7 },
    { playerId: amy.id, points: 3, tiebreaker: 2 },
    { playerId: bob.id, points: 10, tiebreaker: -1 },
    { playerId: cam.id, points: -1, tiebreaker: 50 },
  ];
  const second = [
    { playerId: zed.id, points: -2, tiebreaker: -7 },
    { playerId: amy.id, points: 2, tiebreaker: 2 },
    { playerId: bob.id, points: -5, tiebreaker: 5 },
    { playerId: cam.id, points: -1, tiebreaker: 50 },
  ];
  for (const scores of [first, second]) {
    await genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: scores
        .map(({ playerId, points, tiebreaker }) => ({
          playerId,
          points: String(points * pointsSign),
          tiebreaker: String(tiebreaker * tiebreakerSign),
        }))
        .reverse(),
    });
  }
  closeDB();
  const live = await genericGamesApi.getScoreboard(game.id);
  expect(live?.players.map(({ id }) => id)).toEqual([zed.id, amy.id, bob.id, cam.id]);
  expect(live?.standings).toEqual([
    {
      player: identity(amy),
      place: 1,
      totalPoints: 5 * pointsSign,
      totalTiebreaker: 4 * tiebreakerSign,
    },
    {
      player: identity(bob),
      place: 1,
      totalPoints: 5 * pointsSign,
      totalTiebreaker: 4 * tiebreakerSign,
    },
    { player: identity(zed), place: 3, totalPoints: 5 * pointsSign, totalTiebreaker: 0 },
    {
      player: identity(cam),
      place: 4,
      totalPoints: -2 * pointsSign,
      totalTiebreaker: 100 * tiebreakerSign,
    },
  ]);
  expect(live?.game.status).toBe("active");
  expect(live?.game).not.toHaveProperty("winnerIds");
  const completed = await genericGamesApi.finish(game.id);
  expect(completed.winnerIds).toEqual([amy.id, bob.id]);
  expect(completed.playerSnapshots).toEqual([zed, amy, bob, cam].map(identity));
  await playersApi.update(amy.id, { name: "Renamed", color: "Ocean" });
  await playersApi.delete(bob.id);
  closeDB();
  const reopened = await genericGamesApi.getScoreboard(game.id);
  expect(reopened).toEqual({ ...live, game: completed });
  expect((await genericGamesApi.getDetail(game.id))?.players).toEqual(completed.playerSnapshots);
  expect(await genericGamesApi.getActive()).toEqual([]);
  await expect(
    genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: first.map(({ playerId }) => ({ playerId, points: "0", tiebreaker: "0" })),
    }),
  ).rejects.toThrow("Completed Game");
  expect(await genericGamesApi.getById(game.id)).toEqual(completed);
});

it.each([
  "points",
  "singleRoundWinner",
  "passFail",
] as const)("omits disabled secondary input entirely from %s persistence, totals, places, and wins", async (mode) => {
  const players = await Promise.all(
    ["Zed", "Amy"].map((name) => playersApi.create({ name, color: "Jam", isFavorite: 0 })),
  );
  const game = await genericGamesApi.create({
    players: players.map(({ id }) => id),
    settings:
      mode === "points"
        ? { mode, pointsDirection: "high", tiebreaker: null, dealer: false }
        : { mode, tiebreaker: null, dealer: false },
  });
  for (const winner of [0, 1]) {
    const input: AddGenericRoundInput =
      mode === "points"
        ? {
            mode: "points",
            gameId: game.id,
            scores: players.map(({ id }) => ({ playerId: id, points: "0" })),
          }
        : mode === "singleRoundWinner"
          ? {
              gameId: game.id,
              mode,
              scores: players.map(({ id }, index) => ({ playerId: id, won: index === winner })),
            }
          : {
              gameId: game.id,
              mode,
              scores: players.map(({ id }) => ({ playerId: id, passed: true })),
            };
    input.scores.forEach((score, index) => {
      Object.assign(score, {
        tiebreaker: index === 0 ? "invalid" : "9007199254740993",
        totalTiebreaker: index === 0 ? -100 : 100,
      });
    });
    const saved = await genericRoundsApi.add(input);
    for (const score of saved.scores) {
      expect(score).not.toHaveProperty("tiebreaker");
      expect(score).not.toHaveProperty("totalTiebreaker");
    }
  }
  closeDB();
  const rounds = await genericRoundsApi.getByGameId(game.id);
  for (const round of rounds) {
    for (const score of round.scores) expect(score).not.toHaveProperty("tiebreaker");
  }
  const live = await genericGamesApi.getScoreboard(game.id);
  if (!live) throw new Error("Expected scoreboard");
  expect(live.game.settings.tiebreaker).toBeNull();
  for (const value of [
    ...live.players,
    ...live.standings,
    ...live.rounds.flatMap((r) => r.scores),
  ]) {
    expect(value).not.toHaveProperty("tiebreaker");
    expect(value).not.toHaveProperty("totalTiebreaker");
  }
  expect(live.standings.map(({ player, place }) => [player.id, place])).toEqual(
    players.map(({ id }) => [id, 1]),
  );
  const completed = await genericGamesApi.finish(game.id);
  expect(completed.winnerIds).toEqual(game.players);
  closeDB();
  expect(await genericGamesApi.getScoreboard(game.id)).toEqual({ ...live, game: completed });
});

it.each([
  0, 1,
])("requires an explicit Tiebreaker for Player %s rather than filling missing zero", async (index) => {
  const { game, players } = await createTiebreakerGame();
  const scores = players.map(({ id }) => ({ playerId: id, points: "0", tiebreaker: "0" }));
  Reflect.deleteProperty(scores[index], "tiebreaker");
  const before = await genericGamesApi.getScoreboard(game.id);
  await expect(genericRoundsApi.add({ mode: "points", gameId: game.id, scores })).rejects.toThrow(
    "Enter a whole number for Tiebreaker.",
  );
  closeDB();
  expect(await genericGamesApi.getById(game.id)).toEqual(game);
  expect(await genericRoundsApi.getByGameId(game.id)).toEqual([]);
  expect(await genericGamesApi.getScoreboard(game.id)).toEqual(before);
});

it("preserves both totals and activity when enabled Points overflow before a valid Tiebreaker", async () => {
  const {
    game,
    players: [zed, amy],
  } = await createTiebreakerGame();
  vi.spyOn(Date, "now").mockReturnValue(100);
  const saved = await genericRoundsApi.add({
    mode: "points",
    gameId: game.id,
    scores: [
      { playerId: zed.id, points: "0", tiebreaker: "2" },
      { playerId: amy.id, points: "9007199254740991", tiebreaker: "-3" },
    ],
  });
  const before = await genericGamesApi.getScoreboard(game.id);
  vi.spyOn(Date, "now").mockReturnValue(200);
  await expect(
    genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [
        { playerId: zed.id, points: "4", tiebreaker: "6" },
        { playerId: amy.id, points: "1", tiebreaker: "2" },
      ],
    }),
  ).rejects.toThrow("Total Points");
  closeDB();
  expect(await genericRoundsApi.getByGameId(game.id)).toEqual([saved]);
  expect(await genericGamesApi.getScoreboard(game.id)).toEqual(before);
  expect((await genericGamesApi.getById(game.id))?.lastActivityAt).toBe(100);
});

it("allows independent exact boundary cancellation without adding Tiebreaker into Points", async () => {
  const {
    game,
    players: [zed],
  } = await createTiebreakerGame("high", "low", 1);
  for (const tiebreaker of ["9007199254740991", "-9007199254740991", "-9007199254740991"]) {
    await genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [{ playerId: zed.id, points: "1", tiebreaker }],
    });
  }
  closeDB();
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    players: [{ totalPoints: 3, totalTiebreaker: -9007199254740991 }],
    rounds: [
      { scores: [{ totalPoints: 1, totalTiebreaker: 9007199254740991 }] },
      { scores: [{ totalPoints: 2, totalTiebreaker: 0 }] },
      { scores: [{ totalPoints: 3, totalTiebreaker: -9007199254740991 }] },
    ],
  });
});

it.each([
  undefined,
  null,
  "1",
  Number.NaN,
  Number.POSITIVE_INFINITY,
  1.5,
  9007199254740992,
])("rejects corrupted persisted Tiebreaker %s when reading, appending, or finishing", async (tiebreaker) => {
  const {
    game,
    players: [zed],
  } = await createTiebreakerGame("high", "low", 1);
  const round: GenericRound = {
    gameId: game.id,
    scorekeeper: "generic",
    mode: "points",
    roundNumber: 1,
    scores: [Object.assign({ playerId: zed.id, points: 2, tiebreaker: 0 }, { tiebreaker })],
  };
  await (await getDB()).put("rounds", round);
  closeDB();
  await expect(genericGamesApi.getScoreboard(game.id)).rejects.toThrow("invalid Tiebreaker");
  await expect(
    genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [{ playerId: zed.id, points: "1", tiebreaker: "0" }],
    }),
  ).rejects.toThrow("invalid Tiebreaker");
  await expect(genericGamesApi.finish(game.id)).rejects.toThrow("invalid Tiebreaker");
  expect(await genericRoundsApi.getByGameId(game.id)).toEqual([round]);
  expect(await genericGamesApi.getById(game.id)).toEqual(game);
});

it("rejects historical secondary overflow even if a later saved Round cancels it", async () => {
  const {
    game,
    players: [zed],
  } = await createTiebreakerGame("high", "low", 1);
  const db = await getDB();
  for (const [roundNumber, tiebreaker] of [
    [1, 9007199254740991],
    [2, 1],
    [3, -1],
  ]) {
    await db.put("rounds", {
      gameId: game.id,
      scorekeeper: "generic",
      mode: "points",
      roundNumber,
      scores: [{ playerId: zed.id, points: 1, tiebreaker }],
    });
  }
  closeDB();
  await expect(genericGamesApi.getScoreboard(game.id)).rejects.toThrow("Total Tiebreaker");
  await expect(
    genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [{ playerId: zed.id, points: "1", tiebreaker: "-1" }],
    }),
  ).rejects.toThrow("Total Tiebreaker");
  await expect(genericGamesApi.finish(game.id)).rejects.toThrow("Total Tiebreaker");
  expect(await genericRoundsApi.getByGameId(game.id)).toHaveLength(3);
  expect(await genericGamesApi.getById(game.id)).toEqual(game);
});

function identity<T extends { id: string; name: string; color: string }>({ id, name, color }: T) {
  return { id, name, color };
}

async function createTiebreakerGame(
  pointsDirection: GenericScoreDirection = "high",
  direction: GenericScoreDirection = "high",
  count = 2,
) {
  const players = await Promise.all(
    ["Zed", "Amy", "Bob", "Cam"]
      .slice(0, count)
      .map((name) => playersApi.create({ name, color: "Jam", isFavorite: 0 })),
  );
  const game = await genericGamesApi.create({
    players: players.map((player) => player.id),
    settings: { mode: "points", pointsDirection, tiebreaker: { direction }, dealer: false },
  });
  return { game, players };
}

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}
