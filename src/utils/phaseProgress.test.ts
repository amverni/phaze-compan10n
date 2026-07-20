import { describe, expect, it } from "vitest";
import type { PhaseStatus, RoundScore } from "../types";
import { getNextCurrentPhase, phaseStatusAdvances } from "./phaseProgress";

describe("phaseStatusAdvances", () => {
  it.each([
    ["completed", true],
    ["skipped", true],
    ["failed", false],
    ["satOut", false],
  ] satisfies Array<
    [PhaseStatus, boolean]
  >)("returns %s advancement according to Round result semantics", (phaseStatus, expected) => {
    expect(phaseStatusAdvances(phaseStatus)).toBe(expected);
  });
});

describe("getNextCurrentPhase", () => {
  it("returns the first Current Phase without a previous score", () => {
    expect(getNextCurrentPhase(undefined, 10)).toBe(1);
  });

  it.each([
    "completed",
    "skipped",
  ] satisfies PhaseStatus[])("advances after %s status", (phaseStatus) => {
    expect(getNextCurrentPhase(makeScore({ currentPhase: 4, phaseStatus }), 10)).toBe(5);
  });

  it.each([
    "failed",
    "satOut",
  ] satisfies PhaseStatus[])("keeps the same Current Phase after %s status", (phaseStatus) => {
    expect(getNextCurrentPhase(makeScore({ currentPhase: 4, phaseStatus }), 10)).toBe(4);
  });

  it("clamps active Current Phase within the Phase Set", () => {
    expect(getNextCurrentPhase(makeScore({ currentPhase: 10, phaseStatus: "completed" }), 10)).toBe(
      10,
    );
  });
});

function makeScore(overrides: Partial<RoundScore>): RoundScore {
  return {
    playerId: "player-1",
    currentPhase: 1,
    phaseStatus: "failed",
    score: 0,
    ...overrides,
  };
}
