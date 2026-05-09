import type { GameSettings } from "./game";
import type { PhaseSetId } from "./phaseSet";

export type AppSettingsId = "app";

export interface AppGameDefaults extends GameSettings {
  phaseSetId: PhaseSetId;
}

export interface AppSettings {
  id: AppSettingsId;
  gameDefaults: AppGameDefaults;
}
