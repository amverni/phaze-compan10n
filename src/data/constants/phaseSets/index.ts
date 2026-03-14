import type { BuiltInPhaseSet } from "../../../types";

export const classicPhaseSet: BuiltInPhaseSet = {
  type: "built-in",
  id: "classic",
  name: "Classic",
  phases: [
    "default-classic-1",
    "default-classic-2",
    "default-classic-3",
    "default-classic-4",
    "default-classic-5",
    "default-classic-6",
    "default-classic-7",
    "default-classic-8",
    "default-classic-9",
    "default-classic-10",
  ],
};

export const skipSimilarPhaseSet: BuiltInPhaseSet = {
  type: "built-in",
  id: "skip-similar",
  name: "Quick Game",
  phases: [
    "default-classic-1",
    "default-classic-3",
    "default-classic-6",
    "default-classic-7",
    "default-classic-8",
    "default-classic-10",
  ],
};

export const builtInPhaseSets: BuiltInPhaseSet[] = [classicPhaseSet, skipSimilarPhaseSet];
