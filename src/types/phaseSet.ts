import type { PhaseId } from "./phase";
import type { ArrayAtLeastOne, BuiltInT, SavedT, TemporaryT } from "./utils";

export interface PhaseSet {
  id: PhaseSetId;
  name: string;
  phases: ArrayAtLeastOne<PhaseId>;
  type: BuiltInT | SavedT | TemporaryT;
}

export type BuiltInPhaseSet = PhaseSet & { type: BuiltInT };
export type SavedPhaseSet = PhaseSet & { type: SavedT };
export type TemporaryPhaseSet = PhaseSet & { type: TemporaryT };
export type VisiblePhaseSet = BuiltInPhaseSet | SavedPhaseSet;

export type PhaseSetId = string;
