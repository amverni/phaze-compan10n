import type { BuiltInPhase } from "../../../types";

const classicPhase1: BuiltInPhase = {
  type: "built-in",
  id: "classic-1",
  name: "Phase 1",
  requirements: [
    {
      type: "set",
      count: 3,
      isSameColor: false,
      quantity: 2,
    },
  ],
};

const classicPhase2: BuiltInPhase = {
  type: "built-in",
  id: "classic-2",
  name: "Phase 2",
  requirements: [
    {
      type: "set",
      count: 3,
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

const classicPhase3: BuiltInPhase = {
  type: "built-in",
  id: "classic-3",
  name: "Phase 3",
  requirements: [
    {
      type: "set",
      count: 4,
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

const classicPhase4: BuiltInPhase = {
  type: "built-in",
  id: "classic-4",
  name: "Phase 4",
  requirements: [
    {
      type: "set",
      count: 7,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const classicPhase5: BuiltInPhase = {
  type: "built-in",
  id: "classic-5",
  name: "Phase 5",
  requirements: [
    {
      type: "run",
      count: 8,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const classicPhase6: BuiltInPhase = {
  type: "built-in",
  id: "classic-6",
  name: "Phase 6",
  requirements: [
    {
      type: "run",
      count: 9,
      isSameColor: false,
      quantity: 1,
    },
  ],
};

const classicPhase7: BuiltInPhase = {
  type: "built-in",
  id: "classic-7",
  name: "Phase 7",
  requirements: [
    {
      type: "set",
      count: 4,
      isSameColor: false,
      quantity: 2,
    },
  ],
};

const classicPhase8: BuiltInPhase = {
  type: "built-in",
  id: "classic-8",
  name: "Phase 8",
  requirements: [
    {
      type: "group",
      count: 7,
      isSameColor: true,
      quantity: 1,
    },
  ],
};

const classicPhase9: BuiltInPhase = {
  type: "built-in",
  id: "classic-9",
  name: "Phase 9",
  requirements: [
    {
      type: "set",
      count: 5,
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

const classicPhase10: BuiltInPhase = {
  type: "built-in",
  id: "classic-10",
  name: "Phase 10",
  requirements: [
    {
      type: "set",
      count: 5,
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

export const classicPhases: BuiltInPhase[] = [
  classicPhase1,
  classicPhase2,
  classicPhase3,
  classicPhase4,
  classicPhase5,
  classicPhase6,
  classicPhase7,
  classicPhase8,
  classicPhase9,
  classicPhase10,
];
