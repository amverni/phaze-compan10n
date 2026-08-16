import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeDB } from "../db";
import { phaseSetsApi } from "./phaseSets";

describe("phaseSetsApi", () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  it("does not resolve legacy phase set aliases", async () => {
    await expect(phaseSetsApi.getById("classic")).resolves.toBeUndefined();
  });
});

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
