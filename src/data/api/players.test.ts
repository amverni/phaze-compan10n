import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDB } from "../db";
import { playersApi } from "./players";

describe("playersApi", () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  it("creates, edits, favorites, lists, and deletes Players without a Win Count", async () => {
    const player = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
    expect(player).toEqual({
      id: expect.any(String),
      createdAt: expect.any(Number),
      name: "Amy",
      color: "Jam",
      isFavorite: 0,
    });
    expect(await playersApi.getById(player.id)).toEqual(player);
    expect(await playersApi.getByIds([player.id])).toEqual([player]);

    const edited = await playersApi.update(player.id, { name: "Amelia", color: "Ocean" });
    expect(edited).toEqual({ ...player, name: "Amelia", color: "Ocean" });
    const favorite = await playersApi.update(player.id, { isFavorite: 1 });
    expect(favorite).toEqual({ ...edited, isFavorite: 1 });
    expect(await playersApi.getAll({ isFavorite: 1, name: "amel" })).toEqual([favorite]);
    expect(await playersApi.getAll({ isFavorite: 0 })).toEqual([]);

    await playersApi.delete(player.id);
    expect(await playersApi.getById(player.id)).toBeUndefined();
    expect(await playersApi.getAll()).toEqual([]);
  });
});

async function resetDatabase() {
  closeDB();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("phase10-db");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Test database deletion blocked"));
  });
}
