import { describe, expect, it } from "vitest";
import type { GameId } from "../../types";
import { shouldAutoOpenStandings } from "./standingsAutoOpen";

describe("shouldAutoOpenStandings", () => {
  it("opens once for a Completed Game route", () => {
    const gameId: GameId = "game-1";

    expect(shouldAutoOpenStandings("completed", gameId, null)).toBe(true);
    expect(shouldAutoOpenStandings("completed", gameId, gameId)).toBe(false);
  });

  it("does not auto-open for an Active Game", () => {
    expect(shouldAutoOpenStandings("active", "game-1", null)).toBe(false);
  });
});
