import type { AppSettings } from "../../types";
import { DEFAULT_GAME_SETTINGS } from "./gameSettings";
import { originalPhaseSet } from "./phaseSets";

export const APP_SETTINGS_ID = "app";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: APP_SETTINGS_ID,
  gameDefaults: {
    ...DEFAULT_GAME_SETTINGS,
    phaseSetId: originalPhaseSet.id,
  },
};
