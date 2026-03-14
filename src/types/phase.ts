import type { ArrayAtLeastOne, BuiltInT, SavedT, TemporaryT } from "./utils";

export type Phase = BuiltInPhase | SavedPhase | TemporaryPhase;

export type VisiblePhase = Exclude<Phase, TemporaryPhase>;

export interface BuiltInPhase extends BasePhase {
  type: BuiltInT;
  name: string;
}

export interface SavedPhase extends BasePhase {
  type: SavedT;
  name: string;
}

export interface TemporaryPhase extends BasePhase {
  type: TemporaryT;
}

interface BasePhase {
  id: PhaseId;
  requirements: ArrayAtLeastOne<Meld>;
}

export type PhaseId = string;

type Meld = NumericalMeld | ColorMeld;

interface NumericalMeld {
  type: "set" | "run";
  count: number;
  isSameColor: boolean;
  quantity: number;
}

interface ColorMeld {
  type: "group";
  count: number;
  isSameColor: true;
  quantity: number;
}
