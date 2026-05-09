import type {
  AppGameDefaults,
  AppSettings,
  GameSettings,
  GameTiebreaker,
  PhaseSetId,
} from "../../types";
import { APP_SETTINGS_ID, DEFAULT_APP_SETTINGS } from "../constants/appSettings";
import { getDB } from "../db";
import { phaseSetsApi } from "./phaseSets";

type LegacyAppSettings = Partial<Omit<AppSettings, "gameDefaults">> & {
  game?: Partial<GameSettings>;
  gameDefaults?: Partial<AppGameDefaults>;
};

export const settingsApi = {
  async get(): Promise<AppSettings> {
    const db = await getDB();
    return withSettingsDefaults(await db.get("settings", APP_SETTINGS_ID));
  },

  async updateGameDefaults(updates: Partial<AppGameDefaults>): Promise<AppSettings> {
    const db = await getDB();
    const current = await withSettingsDefaults(await db.get("settings", APP_SETTINGS_ID));
    const nextUpdates = await withValidGameDefaultUpdates(updates);
    const updated: AppSettings = {
      ...current,
      gameDefaults: {
        ...current.gameDefaults,
        ...nextUpdates,
      },
    };

    await db.put("settings", updated);
    return updated;
  },

  setDefaultTiebreaker(tiebreaker: GameTiebreaker): Promise<AppSettings> {
    return this.updateGameDefaults({ tiebreaker });
  },

  setDefaultPhaseSetId(phaseSetId: PhaseSetId): Promise<AppSettings> {
    return this.updateGameDefaults({ phaseSetId });
  },

  async reset(): Promise<AppSettings> {
    const db = await getDB();
    const defaults = await withSettingsDefaults(DEFAULT_APP_SETTINGS);
    await db.put("settings", defaults);
    return defaults;
  },
};

async function withSettingsDefaults(settings?: LegacyAppSettings): Promise<AppSettings> {
  const legacyGameSettings = {
    ...settings?.game,
    ...settings?.gameDefaults,
  };
  const gameDefaults: AppGameDefaults = {
    ...DEFAULT_APP_SETTINGS.gameDefaults,
    ...legacyGameSettings,
  };
  const phaseSet = await phaseSetsApi.getById(gameDefaults.phaseSetId);

  return {
    id: APP_SETTINGS_ID,
    gameDefaults: {
      ...gameDefaults,
      phaseSetId: phaseSet?.id ?? DEFAULT_APP_SETTINGS.gameDefaults.phaseSetId,
    },
  };
}

async function withValidGameDefaultUpdates(
  updates: Partial<AppGameDefaults>,
): Promise<Partial<AppGameDefaults>> {
  if (updates.phaseSetId === undefined) return updates;

  const phaseSet = await phaseSetsApi.getById(updates.phaseSetId);
  if (!phaseSet) throw new Error("Phase set not found");

  return {
    ...updates,
    phaseSetId: phaseSet.id,
  };
}
