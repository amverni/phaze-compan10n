import { describe, expect, it } from "vitest";
import {
  standingsDialogListClasses,
  standingsDialogTabPanelClasses,
  standingsDialogTabPanelHorizontalBleed,
} from "./standingsDialogLayout";

describe("standings dialog layout", () => {
  it("gives glass tab panels enough bleed for list shadows", () => {
    expect(standingsDialogTabPanelHorizontalBleed).toBeGreaterThan(0);
    expect(standingsDialogTabPanelClasses.split(" ")).toContain("py-2");
  });

  it("lets the Standings list size to its rows instead of filling the tab height", () => {
    expect(standingsDialogListClasses.split(" ")).toContain("rounded-2xl");
    expect(standingsDialogListClasses.split(" ")).toContain("max-h-full");
    expect(standingsDialogListClasses.split(" ")).not.toContain("h-full");
  });
});
