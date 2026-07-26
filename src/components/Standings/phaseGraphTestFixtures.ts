import type { ActiveGame, Player, Round } from "../../types";

export const phaseGraphPlayers = {
  amy: makePhaseGraphPlayer("amy", "Amy", "Jam", 0),
  bob: makePhaseGraphPlayer("bob", "Bob", "Santorini", 1),
  cam: makePhaseGraphPlayer("cam", "Cam", "Spearmint", 2),
};

export function makePhaseGraphGame(overrides: Partial<ActiveGame> = {}): ActiveGame {
  return {
    id: "game-1",
    status: "active",
    players: [phaseGraphPlayers.amy.id, phaseGraphPlayers.bob.id, phaseGraphPlayers.cam.id],
    activePlayers: [phaseGraphPlayers.amy.id, phaseGraphPlayers.bob.id, phaseGraphPlayers.cam.id],
    phaseSet: {
      id: "phase-set-1",
      name: "Test phases",
      phases: ["phase-1", "phase-2", "phase-3"],
      type: "temporary",
    },
    settings: {
      tiebreaker: "lowestPoints",
      roundSkipPenalty: 100,
      sitOutPenalty: 50,
    },
    createdAt: 0,
    lastActivityAt: 0,
    ...overrides,
  };
}

export function makePhaseGraphRound(
  roundNumber: number,
  roundWinnerId: string,
  scores: Round["scores"],
): Round {
  return {
    gameId: "game-1",
    roundNumber,
    roundWinnerId,
    scores,
  };
}

function makePhaseGraphPlayer(id: string, name: string, color: string, index: number): Player {
  return {
    id,
    name,
    color,
    createdAt: index,
    wins: 0,
    isFavorite: 0,
  };
}
