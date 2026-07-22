import type { ActiveGame, Player, Round } from "../../types";

export const completionPlayers = {
  amy: makePlayer("amy", "Amy", 2),
  bob: makePlayer("bob", "Bob", 5),
  cam: makePlayer("cam", "Cam", 1),
};

export function makeActiveGame(overrides: Partial<ActiveGame> = {}): ActiveGame {
  const playerIds = [completionPlayers.amy.id, completionPlayers.bob.id];
  return {
    id: "game-1",
    status: "active",
    phaseSet: {
      id: "phase-set-1",
      type: "temporary",
      name: "Short game",
      phases: ["phase-1", "phase-2"],
    },
    players: playerIds,
    activePlayers: playerIds,
    settings: {
      tiebreaker: "lowestPoints",
      roundSkipPenalty: 100,
      sitOutPenalty: 50,
    },
    createdAt: 10,
    lastActivityAt: 10,
    ...overrides,
  };
}

export function makeRound(
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

function makePlayer(id: string, name: string, wins: number): Player {
  return {
    id,
    name,
    color: "Jam",
    createdAt: 0,
    wins,
    isFavorite: 0,
  };
}
