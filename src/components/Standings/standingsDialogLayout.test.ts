import { describe, expect, it } from "vitest";
import {
  standingsDialogTabPanelClasses,
  standingsDialogTabPanelHorizontalBleed,
} from "./standingsDialogLayout";

describe("standings dialog layout", () => {
  it("gives glass tab panels enough bleed for list shadows", () => {
    expect(standingsDialogTabPanelHorizontalBleed).toBeGreaterThan(0);
    expect(standingsDialogTabPanelClasses.split(" ")).toContain("py-2");
  });
});
