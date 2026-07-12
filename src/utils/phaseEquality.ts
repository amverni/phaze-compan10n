import type { Meld, Phase } from "../types";

type PhaseLike = Pick<Phase, "requirements">;

export function areMeldsEqual(left: Meld, right: Meld): boolean {
  return (
    left.type === right.type &&
    left.count === right.count &&
    left.quantity === right.quantity &&
    left.isSameColor === right.isSameColor
  );
}

export function arePhaseRequirementsEqual(left: PhaseLike, right: PhaseLike): boolean {
  return (
    left.requirements.length === right.requirements.length &&
    left.requirements.every((requirement, index) =>
      areMeldsEqual(requirement, right.requirements[index]),
    )
  );
}

export function arePhaseListsEqual(left: PhaseLike[], right: PhaseLike[]): boolean {
  return (
    left.length === right.length &&
    left.every((phase, index) => arePhaseRequirementsEqual(phase, right[index]))
  );
}
