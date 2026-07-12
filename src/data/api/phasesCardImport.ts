import type {
  ArrayAtLeastOne,
  Phase,
  PhaseId,
  PhaseSet,
  PhasesCardPhase,
  SavedPhase,
  SavedPhaseSet,
} from "../../types";
import { arePhaseListsEqual, arePhaseRequirementsEqual } from "../../utils";
import { builtInPhases } from "../constants/phases";
import { getDB } from "../db";

export interface ImportedPhasesCardInput {
  name: string;
  phases: PhasesCardPhase[];
}

export const phasesCardImportApi = {
  async findSavedMatch(input: ImportedPhasesCardInput): Promise<SavedPhaseSet | undefined> {
    const name = normalizeName(input.name);
    const savedPhaseSets = await getSavedPhaseSetsWithResolvedPhases();
    return savedPhaseSets.find(
      ({ phaseSet, phases }) =>
        phaseSet.name.trim() === name && arePhaseListsEqual(phases, input.phases),
    )?.phaseSet;
  },

  async saveImported(input: ImportedPhasesCardInput): Promise<SavedPhaseSet> {
    const name = normalizeName(input.name);
    if (input.phases.length === 0) throw new Error("At least one phase is required");

    const db = await getDB();
    const tx = db.transaction(["customPhases", "customPhaseSets"], "readwrite");
    const phaseStore = tx.objectStore("customPhases");
    const phaseSetStore = tx.objectStore("customPhaseSets");
    const [customPhaseSets, customPhases] = await Promise.all([
      phaseSetStore.getAll(),
      phaseStore.index("by-type").getAll("saved"),
    ]);
    const savedPhases = customPhases.filter(isSavedPhase);
    const existing = findSavedMatchInRecords(
      { name, phases: input.phases },
      customPhaseSets,
      savedPhases,
    );
    if (existing) {
      await tx.done;
      return existing;
    }

    const phaseIds: PhaseId[] = [];
    for (const importedPhase of input.phases) {
      const existingPhase = savedPhases.find((phase) =>
        arePhaseRequirementsEqual(phase, importedPhase),
      );
      if (existingPhase) {
        phaseIds.push(existingPhase.id);
        continue;
      }

      const phase: SavedPhase = {
        id: crypto.randomUUID(),
        type: "saved",
        requirements: importedPhase.requirements as SavedPhase["requirements"],
      };
      await phaseStore.add(phase);
      savedPhases.push(phase);
      phaseIds.push(phase.id);
    }

    const phaseSet: SavedPhaseSet = {
      id: crypto.randomUUID(),
      type: "saved",
      name,
      phases: phaseIds as ArrayAtLeastOne<PhaseId>,
    };
    await phaseSetStore.add(phaseSet);
    await tx.done;
    return phaseSet;
  },
};

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Phase Set name is required");
  return trimmed;
}

async function getSavedPhaseSetsWithResolvedPhases(): Promise<
  Array<{ phaseSet: SavedPhaseSet; phases: Phase[] }>
> {
  const db = await getDB();
  const [customPhaseSets, savedPhases] = await Promise.all([
    db.getAll("customPhaseSets"),
    db.getAllFromIndex("customPhases", "by-type", "saved"),
  ]);
  return getSavedPhaseSetsWithResolvedPhasesFromRecords(
    customPhaseSets,
    savedPhases.filter(isSavedPhase),
  );
}

function findSavedMatchInRecords(
  input: ImportedPhasesCardInput,
  customPhaseSets: PhaseSet[],
  savedPhases: SavedPhase[],
): SavedPhaseSet | undefined {
  const name = normalizeName(input.name);
  return getSavedPhaseSetsWithResolvedPhasesFromRecords(customPhaseSets, savedPhases).find(
    ({ phaseSet, phases }) =>
      phaseSet.name.trim() === name && arePhaseListsEqual(phases, input.phases),
  )?.phaseSet;
}

function getSavedPhaseSetsWithResolvedPhasesFromRecords(
  customPhaseSets: PhaseSet[],
  savedPhases: SavedPhase[],
): Array<{ phaseSet: SavedPhaseSet; phases: Phase[] }> {
  const phaseById = new Map<PhaseId, Phase>([
    ...builtInPhases.map((phase) => [phase.id, phase] as const),
    ...savedPhases.map((phase) => [phase.id, phase] as const),
  ]);

  return customPhaseSets
    .filter(isSavedPhaseSet)
    .map((phaseSet) => ({
      phaseSet,
      phases: phaseSet.phases
        .map((phaseId) => phaseById.get(phaseId))
        .filter((phase): phase is Phase => phase !== undefined),
    }))
    .filter(({ phaseSet, phases }) => phases.length === phaseSet.phases.length);
}

function isSavedPhase(phase: Phase): phase is SavedPhase {
  return phase.type === "saved";
}

function isSavedPhaseSet(phaseSet: PhaseSet): phaseSet is SavedPhaseSet {
  return phaseSet.type === "saved";
}
