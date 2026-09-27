import type { DBSchema } from "idb";
import type {
  AppSettings,
  AppSettingsId,
  GameId,
  Phase,
  PhaseId,
  PhaseSet,
  PhaseSetId,
  Player,
  PlayerId,
  StoredGame,
  StoredRound,
} from "../../types";

export type FavoriteEntityType = "phase" | "phaseSet";

export interface Favorite {
  entityType: FavoriteEntityType;
  entityId: string;
}

export interface Phase10DB extends DBSchema {
  players: {
    key: PlayerId;
    value: Player;
    indexes: {
      "by-isFavorite": number;
    };
  };
  games: {
    key: GameId;
    value: StoredGame;
    indexes: {
      "by-created": number;
      "by-status": string;
    };
  };
  rounds: {
    key: [string, number]; // Composite key: [gameId, roundNumber]
    value: StoredRound;
    indexes: {
      "by-game": string;
    };
  };
  customPhases: {
    key: PhaseId;
    value: Phase;
    indexes: {
      "by-type": string;
    };
  };
  customPhaseSets: {
    key: PhaseSetId;
    value: PhaseSet;
  };
  favorites: {
    key: [string, string]; // Composite key: [entityType, entityId]
    value: Favorite;
    indexes: {
      "by-type": string;
    };
  };
  settings: {
    key: AppSettingsId;
    value: AppSettings;
  };
}
