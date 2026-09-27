import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it } from "vitest";
import type { GenericGameSettings } from "../../types";
import { closeDB } from "../db";
import { genericGamesApi } from "./genericGames";
import { genericRoundsApi } from "./genericRounds";
import { playersApi } from "./players";

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}

beforeEach(resetDatabase);
afterEach(resetDatabase);

it("exposes cumulative signed Points and independent Tiebreaker series in Game Creation Order", async () => {
  const maya = await playersApi.create({ name: "Maya", color: "Jam", isFavorite: 0 });
  const rowan = await playersApi.create({ name: "Rowan", color: "Ocean", isFavorite: 0 });
  const game = await genericGamesApi.create({
    players: [maya.id, rowan.id],
    settings: {
      mode: "points",
      pointsDirection: "low",
      tiebreaker: { direction: "high" },
      dealer: false,
    },
  });
  await genericRoundsApi.add({
    gameId: game.id,
    scores: [
      { playerId: rowan.id, points: "0", tiebreaker: "-4" },
      { playerId: maya.id, points: "-10", tiebreaker: "2" },
    ],
  });
  await genericRoundsApi.add({
    gameId: game.id,
    scores: [
      { playerId: maya.id, points: "4", tiebreaker: "-5" },
      { playerId: rowan.id, points: "-6", tiebreaker: "1" },
    ],
  });
  closeDB();
  const view = await genericGamesApi.getScoreboard(game.id);
  expect(view?.primaryGraph).toEqual({
    metric: "Points",
    direction: "low",
    series: [
      {
        player: { id: maya.id, name: "Maya", color: "Jam" },
        points: [
          { roundNumber: 0, value: 0 },
          { roundNumber: 1, value: -10 },
          { roundNumber: 2, value: -6 },
        ],
      },
      {
        player: { id: rowan.id, name: "Rowan", color: "Ocean" },
        points: [
          { roundNumber: 0, value: 0 },
          { roundNumber: 1, value: 0 },
          { roundNumber: 2, value: -6 },
        ],
      },
    ],
  });
  expect(view?.tiebreakerGraph).toEqual({
    metric: "Tiebreaker",
    direction: "high",
    series: [
      {
        player: { id: maya.id, name: "Maya", color: "Jam" },
        points: [
          { roundNumber: 0, value: 0 },
          { roundNumber: 1, value: 2 },
          { roundNumber: 2, value: -3 },
        ],
      },
      {
        player: { id: rowan.id, name: "Rowan", color: "Ocean" },
        points: [
          { roundNumber: 0, value: 0 },
          { roundNumber: 1, value: -4 },
          { roundNumber: 2, value: -3 },
        ],
      },
    ],
  });
  expect(view?.standings).toMatchObject([
    { player: { id: maya.id }, place: 1, totalPoints: -6, totalTiebreaker: -3 },
    { player: { id: rowan.id }, place: 1, totalPoints: -6, totalTiebreaker: -3 },
  ]);
  expect((await genericGamesApi.finish(game.id)).winnerIds).toEqual([maya.id, rowan.id]);
});

it.each([
  "singleRoundWinner",
  "passFail",
] as const)("graphs actual accumulated %s results, including unchanged counts, without a Tiebreaker", async (mode) => {
  const maya = await playersApi.create({ name: "Maya", color: "Jam", isFavorite: 0 });
  const rowan = await playersApi.create({ name: "Rowan", color: "Ocean", isFavorite: 0 });
  const game = await genericGamesApi.create({
    players: [maya.id, rowan.id],
    settings: { mode, dealer: false, tiebreaker: null },
  });
  for (const outcomes of mode === "passFail"
    ? [
        [true, true],
        [false, false],
        [true, false],
      ]
    : [
        [true, false],
        [false, true],
        [true, false],
      ]) {
    await genericRoundsApi.add(
      mode === "passFail"
        ? {
            gameId: game.id,
            mode,
            scores: [
              { playerId: maya.id, passed: outcomes[0] },
              { playerId: rowan.id, passed: outcomes[1] },
            ],
          }
        : {
            gameId: game.id,
            mode,
            scores: [
              { playerId: maya.id, won: outcomes[0] },
              { playerId: rowan.id, won: outcomes[1] },
            ],
          },
    );
  }
  closeDB();
  const view = await genericGamesApi.getScoreboard(game.id);
  expect(view?.tiebreakerGraph).toBeNull();
  expect(view?.primaryGraph).toMatchObject({
    metric: mode === "passFail" ? "Passes" : "Rounds Won",
    direction: "high",
    series: [
      {
        player: { id: maya.id },
        points: [
          { roundNumber: 0, value: 0 },
          { roundNumber: 1, value: 1 },
          { roundNumber: 2, value: 1 },
          { roundNumber: 3, value: 2 },
        ],
      },
      {
        player: { id: rowan.id },
        points: [
          { roundNumber: 0, value: 0 },
          { roundNumber: 1, value: mode === "passFail" ? 1 : 0 },
          { roundNumber: 2, value: 1 },
          { roundNumber: 3, value: 1 },
        ],
      },
    ],
  });
  expect((await genericGamesApi.finish(game.id)).winnerIds).toEqual([maya.id]);
});

const settingsCases: GenericGameSettings[] = [
  { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
  { mode: "points", pointsDirection: "high", tiebreaker: { direction: "high" }, dealer: false },
  { mode: "points", pointsDirection: "high", tiebreaker: { direction: "low" }, dealer: false },
  { mode: "points", pointsDirection: "low", tiebreaker: { direction: "high" }, dealer: false },
  { mode: "points", pointsDirection: "low", tiebreaker: { direction: "low" }, dealer: false },
  { mode: "singleRoundWinner", tiebreaker: null, dealer: false },
  { mode: "passFail", tiebreaker: null, dealer: false },
];

it.each(
  settingsCases,
)("uses live identities then captured snapshots for graph settings %j", async (settings) => {
  const player = await playersApi.create({ name: "Maya", color: "Jam", isFavorite: 0 });
  const game = await genericGamesApi.create({ players: [player.id], settings });
  const initial = await genericGamesApi.getScoreboard(game.id);
  expect(initial?.primaryGraph.series[0].points).toEqual([{ roundNumber: 0, value: 0 }]);
  expect(initial?.rounds).toEqual([]);
  if (settings.tiebreaker) {
    expect(initial?.tiebreakerGraph?.series[0].points).toEqual([{ roundNumber: 0, value: 0 }]);
    expect(initial?.tiebreakerGraph?.direction).toBe(settings.tiebreaker.direction);
  } else {
    expect(initial?.tiebreakerGraph).toBeNull();
  }
  await genericRoundsApi.add(
    settings.mode === "points"
      ? { gameId: game.id, scores: [{ playerId: player.id, points: "0", tiebreaker: "-8" }] }
      : settings.mode === "singleRoundWinner"
        ? { gameId: game.id, mode: settings.mode, scores: [{ playerId: player.id, won: true }] }
        : {
            gameId: game.id,
            mode: settings.mode,
            scores: [{ playerId: player.id, passed: false }],
          },
  );
  await playersApi.update(player.id, { name: "Maya at completion", color: "#123456" });
  const active = await genericGamesApi.getScoreboard(game.id);
  const identity = { id: player.id, name: "Maya at completion", color: "#123456" };
  expect(active?.primaryGraph.series[0].player).toEqual(identity);
  expect(active?.primaryGraph.series[0].points).toEqual([
    { roundNumber: 0, value: 0 },
    { roundNumber: 1, value: settings.mode === "singleRoundWinner" ? 1 : 0 },
  ]);
  if (settings.tiebreaker) {
    expect(active?.tiebreakerGraph?.series[0]).toEqual({
      player: identity,
      points: [
        { roundNumber: 0, value: 0 },
        { roundNumber: 1, value: -8 },
      ],
    });
  }
  await genericGamesApi.finish(game.id);
  await playersApi.update(player.id, { name: "Later name", color: "#ffffff" });
  await playersApi.delete(player.id);
  closeDB();
  const completed = await genericGamesApi.getScoreboard(game.id);
  expect(completed?.primaryGraph).toEqual(active?.primaryGraph);
  expect(completed?.tiebreakerGraph).toEqual(active?.tiebreakerGraph);
  expect(completed?.standings).toEqual(active?.standings);
});
