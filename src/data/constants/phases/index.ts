import type { BuiltInPhase } from "../../../types";
import { classicPhases } from "./classic";
import { phase20Phases } from "./phase20";
import { phase21Phases } from "./phase21";
import { phase30Phases } from "./phase30";

export const builtInPhases: BuiltInPhase[] = [
  ...classicPhases,
  ...phase21Phases,
  ...phase20Phases,
  ...phase30Phases,
];
