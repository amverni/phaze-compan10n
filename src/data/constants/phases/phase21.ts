import type { BuiltInPhase } from "../../../types";

const phase21Phase11: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-11",
  requirements: [
    {
      type: "set",
      count: 2,
      isSameColor: false,
      quantity: 4,
    },
  ],
};

const phase21Phase12: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-12",
  requirements: [
    {
      type: "set",
      count: 4,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "run",
      count: 5,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase21Phase13: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-13",
  requirements: [
    {
      type: "set",
      count: 5,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "run",
      count: 5,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase21Phase14: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-14",
  requirements: [
    {
      type: "run",
      count: 4,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "colorGroup",
      count: 4,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase21Phase15: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-15",
  requirements: [
    {
      type: "run",
      count: 5,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "colorGroup",
      count: 4,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase21Phase16: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-16",
  requirements: [
    {
      type: "run",
      count: 10,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase21Phase17: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-17",
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

const phase21Phase18: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-18",
  requirements: [
    {
      type: "colorGroup",
      count: 9,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase21Phase19: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-19",
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

const phase21Phase20: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-20",
  requirements: [
    {
      type: "set",
      count: 6,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "set",
      count: 3,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase21Phase21: BuiltInPhase = {
  type: "built-in",
  id: "phase-21-21",
  requirements: [
    {
      type: "run",
      count: 11,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

export const phase21Phases: BuiltInPhase[] = [
  phase21Phase11,
  phase21Phase12,
  phase21Phase13,
  phase21Phase14,
  phase21Phase15,
  phase21Phase16,
  phase21Phase17,
  phase21Phase18,
  phase21Phase19,
  phase21Phase20,
  phase21Phase21,
];
