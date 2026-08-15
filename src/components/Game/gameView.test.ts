import { describe, expect, it } from "vitest";
import { shouldShowPhasesCardEntryButton } from "./gameView";

describe("game view", () => {
  it("shows the Phases Card entry button only for Active Games", () => {
    expect(shouldShowPhasesCardEntryButton("active")).toBe(true);
    expect(shouldShowPhasesCardEntryButton("completed")).toBe(false);
  });
});
