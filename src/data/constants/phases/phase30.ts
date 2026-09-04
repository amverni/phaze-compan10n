import type { BuiltInPhase } from "../../../types";

const phase30Phase21: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-21",
  requirements: [
    {
      type: "run",
      count: 3,
      isSameColor: false,
      quantity: 3,
    },
  ],
};

const phase30Phase22: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-22",
  requirements: [
    {
      type: "run",
      count: 2,
      isSameColor: false,
      quantity: 4,
    },
  ],
};

const phase30Phase23: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-23",
  requirements: [
    {
      type: "set",
      count: 2,
      isSameColor: true,
      quantity: 3,
    },
  ],
};

const phase30Phase24: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-24",
  requirements: [
    {
      type: "set",
      count: 2,
      isSameColor: true,
      quantity: 4,
    },
  ],
};

const phase30Phase25: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-25",
  requirements: [
    {
      type: "run",
      count: 3,
      isSameColor: true,
      quantity: 2,
    },
  ],
};

const phase30Phase26: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-26",
  requirements: [
    {
      type: "set",
      count: 5,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "colorGroup",
      count: 3,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase30Phase27: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-27",
  requirements: [
    {
      type: "set",
      count: 6,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "set",
      count: 2,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase30Phase28: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-28",
  requirements: [
    {
      type: "set",
      count: 7,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase30Phase29: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-29",
  requirements: [
    {
      type: "set",
      count: 5,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "set",
      count: 4,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase30Phase30: BuiltInPhase = {
  type: "built-in",
  id: "phase-30-30",
  requirements: [
    {
      type: "set",
      count: 3,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "run",
      count: 3,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "colorGroup",
      count: 3,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

export const phase30Phases: BuiltInPhase[] = [
  phase30Phase21,
  phase30Phase22,
  phase30Phase23,
  phase30Phase24,
  phase30Phase25,
  phase30Phase26,
  phase30Phase27,
  phase30Phase28,
  phase30Phase29,
  phase30Phase30,
];
