import type { ActiveGame, CompletedGame, PlayerIdentity, Round } from "../../types";
import { capturePlayerSnapshots } from "./gameResults";
import { deriveStandings } from "./standings";

interface ResolveGameCompletionInput {
  game: ActiveGame;
  players: readonly PlayerIdentity[];
  rounds: readonly Round[];
  completedAt: number;
}

export interface GameCompletionResolution {
  completedGame: CompletedGame;
  gameWinner: PlayerIdentity;
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
      scorekeeper: "phase10",
      status: "completed",
      phaseSet: input.game.phaseSet,
      players: standings.includedPlayers.map((player) => player.id),
      settings: input.game.settings,
      createdAt: input.game.createdAt,
      lastActivityAt: input.completedAt,
      completedAt: input.completedAt,
      completionType: "normal",
      winnerIds: [gameWinner.id],
      playerSnapshots: capturePlayerSnapshots(
        standings.includedPlayers.map((player) => player.id),
        input.players,
      ),
    },
    gameWinner,
  };
}
