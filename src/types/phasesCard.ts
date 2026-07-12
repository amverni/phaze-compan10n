import type { Meld, Phase } from "./phase";
import type { PhaseSet } from "./phaseSet";

export type PhasesCardPhase = Pick<Phase, "requirements">;

export interface PhasesCardSharePayloadV1 {
  v: 1;
  name: string;
  phases: Array<{
    requirements: Meld[];
  }>;
}

export interface PhasesCardShareTarget {
  name: string;
  phases: PhasesCardPhase[];
  phaseSet?: Pick<PhaseSet, "id" | "type">;
}
