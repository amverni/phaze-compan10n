import type { DBSchema } from "idb";
import type { Game, Player, Round } from "../../types";
import type { GameId } from "../../types/game";
import type { Phase, PhaseId } from "../../types/phase";
import type { PhaseSet, PhaseSetId } from "../../types/phaseSet";
import type { PlayerId } from "../../types/player";

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
  };
  customPhaseSets: {
    key: PhaseSetId;
    value: PhaseSet;
  };
}
