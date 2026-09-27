import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { closeDB } from "../db";
import { gamesApi } from "./games";
import { playersApi } from "./players";
import { roundsApi } from "./rounds";

beforeEach(resetDatabase);
afterEach(async () => {
  vi.restoreAllMocks();
  await resetDatabase();
});

it("lists mixed Games by activity then creation, using immutable Completed identities and live Active identities", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(100);
  const player = await playersApi.create({ name: "Amy", color: "Jam", isFavorite: 0 });
  const input = {
    players: [player.id],
    phaseSet: { id: "short", type: "temporary", name: "Short", phases: ["phase-1"] },
    settings: { tiebreaker: "roundsWon", roundSkipPenalty: 100, sitOutPenalty: 0 },
  } as const;
  const completed = await gamesApi.create({
    ...input,
    players: [...input.players],
    phaseSet: { ...input.phaseSet, phases: [...input.phaseSet.phases] },
  });
  clock.mockReturnValue(200);
  const active = await gamesApi.create({
    ...input,
    players: [...input.players],
    phaseSet: { ...input.phaseSet, phases: [...input.phaseSet.phases] },
  });
  await roundsApi.add({
    gameId: completed.id,
    roundWinnerId: player.id,
    scores: [{ playerId: player.id, phaseStatus: "completed", score: 0 }],
  });
  await playersApi.update(player.id, { name: "Amelia", color: "Ocean" });
  closeDB();

  expect(await gamesApi.getList()).toEqual([
    {
      id: active.id,
      status: "active",
      lastActivityAt: 200,
      players: [expect.objectContaining({ id: player.id, name: "Amelia", color: "Ocean" })],
    },
    {
      id: completed.id,
      status: "completed",
      lastActivityAt: 200,
      players: [{ id: player.id, name: "Amy", color: "Jam" }],
    },
  ]);
  expect((await gamesApi.getList({ activeOnly: true })).map((game) => game.id)).toEqual([
    active.id,
  ]);

  await gamesApi.delete(active.id);
  await playersApi.delete(player.id);
  const beforeViewing = await gamesApi.getById(completed.id);
  clock.mockReturnValue(500);
  expect(await gamesApi.getList()).toMatchObject([
    { id: completed.id, players: [{ name: "Amy", color: "Jam" }], lastActivityAt: 200 },
  ]);
  expect(await gamesApi.getById(completed.id)).toEqual(beforeViewing);
});

async function resetDatabase() {
  closeDB();
  await deleteDB("phase10-db");
}
