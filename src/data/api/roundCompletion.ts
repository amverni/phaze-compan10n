import type { ActiveGame, CompletedGame, Player, Round } from "../../types";
import { deriveStandings } from "./standings";

interface ResolveGameCompletionInput {
  game: ActiveGame;
  players: readonly Player[];
  rounds: readonly Round[];
  completedAt: number;
}

export interface GameCompletionResolution {
  completedGame: CompletedGame;
  gameWinner: Player;
}

export function resolveGameCompletion(
  input: ResolveGameCompletionInput,
): GameCompletionResolution | null {
  const standings = deriveStandings({
    game: input.game,
    players: input.players,
    rounds: input.rounds,
  });

  if (!standings.hasFinishedPlayers || !standings.gameWinner) {
    return null;
  }

  const gameWinner = standings.gameWinner.player;
  return {
    completedGame: {
      id: input.game.id,
      status: "completed",
      phaseSet: input.game.phaseSet,
      players: standings.includedPlayers.map((player) => player.id),
      settings: input.game.settings,
      createdAt: input.game.createdAt,
      lastActivityAt: input.completedAt,
      completedAt: input.completedAt,
      winnerId: gameWinner.id,
      winnerName: gameWinner.name,
    },
    gameWinner,
  };
}
