import type { BuiltInPhaseSet } from "../../../types";

export const classicPhaseSet: BuiltInPhaseSet = {
  type: "built-in",
  id: "classic",
  name: "Classic",
  phases: [
    "classic-1",
    "classic-2",
    "classic-3",
    "classic-4",
    "classic-5",
    "classic-6",
    "classic-7",
    "classic-8",
    "classic-9",
    "classic-10",
  ],
};

export const skipSimilarPhaseSet: BuiltInPhaseSet = {
  type: "built-in",
  id: "skip-similar",
  name: "Quick Game",
  phases: ["classic-1", "classic-3", "classic-6", "classic-7", "classic-8", "classic-10"],
};

export const builtInPhaseSets: BuiltInPhaseSet[] = [classicPhaseSet, skipSimilarPhaseSet];
