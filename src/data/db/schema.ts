import type { DBSchema } from "idb";
import type {
  Game,
  GameId,
  Phase,
  PhaseId,
  PhaseSet,
  PhaseSetId,
  Player,
  PlayerId,
  Round,
} from "../../types";

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
    value: Game;
    indexes: {
      "by-created": number;
      "by-status": string;
    };
  };
  rounds: {
    key: [string, number]; // Composite key: [gameId, roundNumber]
    value: Round;
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
}
