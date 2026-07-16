import type { Meld, Phase } from "./phase";
import type { PhaseSet, PhaseSetId } from "./phaseSet";

export type PhasesCardPhase = Pick<Phase, "requirements">;

export interface PhasesCardSharePayloadV1 {
  v: 1;
  name: string;
  phases: Array<{
    requirements: Meld[];
  }>;
}

interface PhasesCardPhaseSetShareTarget {
  source: "phase-set";
  name: string;
  phases: PhasesCardPhase[];
  phaseSet: Pick<PhaseSet, "id" | "type">;
}

interface PhasesCardCustomShareTarget {
  source: "custom";
  name: string;
  phases: PhasesCardPhase[];
}

interface PhasesCardGameSnapshotShareTarget {
  source: "game-snapshot";
  name: string;
  phases: PhasesCardPhase[];
  builtInPhaseSetId?: PhaseSetId | null;
}

export type PhasesCardShareTarget =
  | PhasesCardPhaseSetShareTarget
  | PhasesCardCustomShareTarget
  | PhasesCardGameSnapshotShareTarget;
