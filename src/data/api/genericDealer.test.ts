import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it } from "vitest";
import { closeDB } from "../db";
import { genericGamesApi } from "./genericGames";
import { genericRoundsApi } from "./genericRounds";
import { playersApi } from "./players";

beforeEach(resetDatabase);
afterEach(resetDatabase);

it.each([true, false])("handles solo rounds with Dealer enabled: %s", async (dealer) => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const game = await genericGamesApi.create({
    players: [amy.id],
    settings: { mode: "points", pointsDirection: "low", tiebreaker: null, dealer },
  });
  const expectedDealer = dealer ? amy.id : null;
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    upcomingDealerId: expectedDealer,
  });
  for (const points of ["-1", "0", "10"]) {
    await genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [{ playerId: amy.id, points }],
    });
  }
  await expect(
    genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [{ playerId: amy.id, points: "" }],
    }),
  ).rejects.toThrow("Points");
  closeDB();
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    game: { settings: { dealer } },
    rounds: [
      { roundNumber: 1, dealerId: expectedDealer },
      { roundNumber: 2, dealerId: expectedDealer },
      { roundNumber: 3, dealerId: expectedDealer },
    ],
    upcomingDealerId: expectedDealer,
  });
});

it("rotates saved and upcoming Dealers in fixed Game Creation Order, not score or Player name order", async () => {
  const amy = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 1 });
  const bob = await playersApi.create({ name: "Bob", color: "Ocean", isFavorite: 0 });
  const zed = await playersApi.create({ name: "Zed", color: "Rose", isFavorite: 0 });
  const game = await genericGamesApi.create({
    players: [zed.id, amy.id, bob.id],
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: true },
  });
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    rounds: [],
    upcomingDealerId: zed.id,
  });
  for (const nextDealer of [amy.id, bob.id, zed.id, amy.id]) {
    await genericRoundsApi.add({
      mode: "points",
      gameId: game.id,
      scores: [
        { playerId: bob.id, points: "20" },
        { playerId: amy.id, points: "10" },
        { playerId: zed.id, points: "-1" },
      ],
    });
    closeDB();
    expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
      upcomingDealerId: nextDealer,
    });
  }
  await playersApi.update(zed.id, { name: "Aaron", isFavorite: 1 });
  closeDB();
  expect(await genericGamesApi.getScoreboard(game.id)).toMatchObject({
    players: [{ id: zed.id }, { id: amy.id }, { id: bob.id }],
    rounds: [
      { roundNumber: 1, dealerId: zed.id },
      { roundNumber: 2, dealerId: amy.id },
      { roundNumber: 3, dealerId: bob.id },
      { roundNumber: 4, dealerId: zed.id },
    ],
    upcomingDealerId: amy.id,
    standings: [{ player: { id: bob.id } }, { player: { id: amy.id } }, { player: { id: zed.id } }],
  });
  const noDealer = await genericGamesApi.create({
    players: game.players,
    settings: { ...game.settings, dealer: false },
  });
  await genericRoundsApi.add({
    mode: "points",
    gameId: noDealer.id,
    scores: game.players.map((playerId) => ({ playerId, points: "0" })),
  });
  closeDB();
  expect(await genericGamesApi.getScoreboard(noDealer.id)).toMatchObject({
    rounds: [{ dealerId: null }],
    upcomingDealerId: null,
  });
});

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}
