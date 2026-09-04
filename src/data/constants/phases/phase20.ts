import type { BuiltInPhase } from "../../../types";

const phase20Phase11: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-11",
  requirements: [
    {
      type: "run",
      count: 4,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "colorGroup",
      count: 5,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase20Phase12: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-12",
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

const phase20Phase13: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-13",
  requirements: [
    {
      type: "colorGroup",
      count: 8,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase20Phase14: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-14",
  requirements: [
    {
      type: "run",
      count: 4,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase20Phase15: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-15",
  requirements: [
    {
      type: "run",
      count: 6,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase20Phase16: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-16",
  requirements: [
    {
      type: "colorGroup",
      count: 9,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const phase20Phase17: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-17",
  requirements: [
    {
      type: "set",
      count: 3,
      isSameColor: false,
      quantity: 3,
    },
  ],
};

const phase20Phase18: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-18",
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

const phase20Phase19: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-19",
  requirements: [
    {
      type: "set",
      count: 5,
      isSameColor: false,
      quantity: 1,
    },
    {
      type: "run",
      count: 4,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const phase20Phase20: BuiltInPhase = {
  type: "built-in",
  id: "phase-20-20",
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

export const phase20Phases: BuiltInPhase[] = [
  phase20Phase11,
  phase20Phase12,
  phase20Phase13,
  phase20Phase14,
  phase20Phase15,
  phase20Phase16,
  phase20Phase17,
  phase20Phase18,
  phase20Phase19,
  phase20Phase20,
];
