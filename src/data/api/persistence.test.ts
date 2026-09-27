import "fake-indexeddb/auto";
import { deleteDB, openDB } from "idb";
import { afterEach, beforeEach, expect, it } from "vitest";
import { closeDB } from "../db";
import { favoritesApi } from "./favorites";
import { gamesApi } from "./games";
import { genericGamesApi } from "./genericGames";
import { phaseSetsApi } from "./phaseSets";
import { phasesApi } from "./phases";
import { playersApi } from "./players";
import { roundsApi } from "./rounds";
import { settingsApi } from "./settings";

beforeEach(resetDatabase);
afterEach(resetDatabase);

it("resets all disposable pre-refactor data once, then preserves new data on reopen", async () => {
  const legacy = await openDB("phase10-db", 7, {
    upgrade(db) {
      for (const store of [
        "players",
        "games",
        "rounds",
        "customPhases",
        "customPhaseSets",
        "favorites",
        "settings",
      ]) {
        db.createObjectStore(store);
      }
    },
  });
  for (const store of legacy.objectStoreNames) {
    await legacy.put(store, { id: "legacy", name: "Disposable" }, "legacy");
  }
  legacy.close();

  expect(await playersApi.getAll()).toEqual([]);
  expect(await gamesApi.getAll()).toEqual([]);
  expect(await roundsApi.getByGameId("legacy")).toEqual([]);
  expect(await phasesApi.getAll({ type: "saved" })).toEqual([]);
  expect(await phaseSetsApi.getById("legacy")).toBeUndefined();
  expect(await favoritesApi.getAll("phase")).toEqual([]);
  expect(await favoritesApi.getAll("phaseSet")).toEqual([]);
  expect(await settingsApi.get()).not.toHaveProperty("name");

  const player = await playersApi.create({ name: "New Player", color: "Jam", isFavorite: 1 });
  const settings = await settingsApi.setDefaultSitOutPenalty(25);
  const phase = await phasesApi.create({
    type: "saved",
    requirements: [{ type: "set", count: 4, isSameColor: false, quantity: 1 }],
  });
  await favoritesApi.add("phase", phase.id);
  closeDB();
  expect(await playersApi.getAll()).toEqual([player]);
  expect(await settingsApi.get()).toEqual(settings);
  expect(await phasesApi.getById(phase.id)).toEqual(phase);
  expect(await favoritesApi.getAll("phase")).toEqual([phase.id]);
  closeDB();
  expect(await playersApi.getById(player.id)).toEqual(player);
});

it("retries generic list and detail reads after a rejected database open", async () => {
  const incompatible = await openDB("phase10-db", 9);
  incompatible.close();
  const failed = await Promise.allSettled([
    genericGamesApi.getActiveViews(),
    genericGamesApi.getDetail("missing"),
  ]);
  expect(failed.map((result) => result.status)).toEqual(["rejected", "rejected"]);
  await deleteDB("phase10-db");

  expect(await genericGamesApi.getActiveViews()).toEqual([]);
  expect(await genericGamesApi.getDetail("missing")).toBeNull();
  const player = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const game = await genericGamesApi.create({
    players: [player.id],
    settings: { mode: "points", pointsDirection: "high", tiebreaker: null, dealer: false },
  });
  expect(await genericGamesApi.getDetail(game.id)).toEqual({ game, players: [player] });
});

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}
