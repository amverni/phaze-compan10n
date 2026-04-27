import type {
  BuiltInT,
  MeldType,
  Phase,
  PhaseId,
  SavedPhase,
  SavedT,
  TemporaryPhase,
  VisiblePhase,
} from "../../types";
import { shuffle } from "../../utils";
import { builtInPhaseSets } from "../constants/phaseSets";
import { builtInPhases } from "../constants/phases";
import { getDB } from "../db";
import { favoritesApi } from "./favorites";
import { nameMatchScore } from "./utils";

export const phasesApi = {
  /**
   * Get all phases, optionally filtered by type, name, favorite status,
   * meld type, and/or phase set membership.
   *
   * Temporary phases are never returned by this method. Use `getById` or
   * `getByIds` to retrieve temporary phases.
   *
   * Built-in phases (from constants) are merged with saved phases stored
   * in the database.
   *
   * @param filters - Optional filters to narrow results.
   * @param filters.type - Filter by phase type: `"built-in"` or `"saved"`.
   * @param filters.name - Filter by name substring match.
   * @param filters.isFavorite - Filter to only favorited phases when `1`.
   * @param filters.meldTypes - Filter to phases containing a meld of any of these types.
   * @param filters.phaseSetId - Filter to phases belonging to this phase set.
   * @returns The matching phases, sorted by name relevance when a name filter is provided.
   */
  async getAll(filters?: {
    type?: BuiltInT | SavedT;
    name?: string;
    isFavorite?: 0 | 1;
    meldTypes?: MeldType[];
    phaseSetId?: string;
  }): Promise<VisiblePhase[]> {
    let phases: VisiblePhase[] = [];

    if (filters?.type !== "saved") {
      phases.push(...builtInPhases);
    }
    if (filters?.type !== "built-in") {
      const db = await getDB();
      const allByType = await db.getAllFromIndex("customPhases", "by-type", "saved");
      const savedPhases = allByType.filter((p): p is SavedPhase => p.type === "saved");

      phases.push(...savedPhases);
    }

    // Filter by phase set membership
    if (filters?.phaseSetId) {
      const phaseSet = builtInPhaseSets.find((ps) => ps.id === filters.phaseSetId);
      if (phaseSet) {
        const phaseSetIds = new Set(phaseSet.phases);
        phases = phases.filter((p) => phaseSetIds.has(p.id));
      } else {
        const db = await getDB();
        const customPhaseSet = await db.get("customPhaseSets", filters.phaseSetId);
        if (customPhaseSet) {
          const phaseSetIds = new Set(customPhaseSet.phases);
          phases = phases.filter((p) => phaseSetIds.has(p.id));
        } else {
          phases = [];
        }
      }
    }

    // Filter by meld type
    if (filters?.meldTypes && filters.meldTypes.length > 0) {
      const types = new Set(filters.meldTypes);
      phases = phases.filter((p) => p.requirements.some((m) => types.has(m.type)));
    }

    // Filter by favorite status
    if (filters?.isFavorite === 1) {
      const favoriteIds = await favoritesApi.getAll("phase");
      const favoriteSet = new Set(favoriteIds);
      phases = phases.filter((p) => favoriteSet.has(p.id));
    }

    if (filters?.name) {
      const search = filters.name.toLowerCase();
      phases = phases
        .filter((p) => p.name.toLowerCase().includes(search))
        .sort((a, b) => nameMatchScore(b.name, search) - nameMatchScore(a.name, search));
    }

    return phases;
  },

  /**
   * Get a single phase by its unique ID.
   *
   * Looks up the phase in built-in constants first, then checks the database
   * for custom phases. Returns any phase type, including temporary.
   *
   * @param id - The unique identifier of the phase to retrieve.
   * @returns The phase if found, or `undefined` if no phase exists with the given ID.
   */
  async getById(id: PhaseId): Promise<Phase | undefined> {
    const builtIn = builtInPhases.find((p) => p.id === id);
    if (builtIn) return builtIn;

    const db = await getDB();
    return db.get("customPhases", id);
  },

  /**
   * Get multiple phases by their IDs.
   *
   * Looks up each ID in built-in constants first, then falls back to the
   * database. Phases that are not found are silently excluded from the result.
   * Returns any phase type, including temporary.
   *
   * @param ids - An array of phase IDs to look up.
   * @returns An array of found phases. The order is not guaranteed to match the input order.
   */
  async getByIds(ids: PhaseId[]): Promise<Phase[]> {
    const db = await getDB();
    const builtInMap = new Map(builtInPhases.map((p) => [p.id, p]));

    const phases = await Promise.all(
      ids.map((id) => {
        const builtIn = builtInMap.get(id);
        if (builtIn) return builtIn;
        return db.get("customPhases", id);
      }),
    );

    return phases.filter((p): p is Phase => p !== undefined);
  },

  /**
   * Create a new phase.
   *
   * Supports creating both saved phases (with a name) and temporary phases
   * (without a name). Automatically generates a unique ID (UUID v4).
   *
   * @param data - The phase data, excluding `id` which is generated automatically.
   * @returns The newly created phase, including the generated `id`.
   */
  async create(data: Omit<SavedPhase, "id"> | Omit<TemporaryPhase, "id">): Promise<Phase> {
    const db = await getDB();
    const id: PhaseId = crypto.randomUUID();
    const newPhase: SavedPhase | TemporaryPhase = { ...data, id };
    await db.add("customPhases", newPhase);
    return newPhase;
  },

  /**
   * Get a random selection of phases.
   *
   * Returns up to `count` phases randomly sampled from all visible phases.
   * If fewer phases exist than requested, returns all of them (shuffled).
   *
   * @param count - The maximum number of phases to return.
   * @returns A shuffled array of up to `count` phases.
   */
  async getRandom(count: number): Promise<VisiblePhase[]> {
    const allPhases = await this.getAll();
    if (allPhases.length === 0) return [];
    return shuffle(allPhases).slice(0, count);
  },

  /**
   * Delete a phase by ID.
   *
   * Removes the phase record from the database. No error is thrown if the
   * phase does not exist. Only custom phases (saved/temporary) can be deleted;
   * built-in phases cannot be removed and will cause an error.
   *
   * @param id - The unique identifier of the phase to delete.
   * @throws {Error} If the ID belongs to a built-in phase.
   */
  delete(id: PhaseId): Promise<void> {
    return this.deleteByIds([id]);
  },

  /**
   * Delete multiple phases by their IDs.
   *
   * Removes matching phase records from the database. IDs that do not exist
   * are silently ignored. Only custom phases (saved/temporary) can be deleted;
   * built-in phase IDs will cause an error.
   *
   * @param ids - An array of phase IDs to delete.
   * @throws {Error} If any ID belongs to a built-in phase.
   */
  async deleteByIds(ids: PhaseId[]): Promise<void> {
    const builtInIds = new Set(builtInPhases.map((p) => p.id));
    const invalidIds = ids.filter((id) => builtInIds.has(id));
    if (invalidIds.length > 0) {
      throw new Error(`Cannot delete built-in phase(s): ${invalidIds.join(", ")}`);
    }

    const db = await getDB();
    const tx = db.transaction("customPhases", "readwrite");
    await Promise.all([...ids.map((id) => tx.store.delete(id)), tx.done]);
  },
};
