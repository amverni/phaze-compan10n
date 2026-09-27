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
    completedGame: createCompletedGame(input, standings.includedPlayers, "normal", [gameWinner.id]),
    gameWinner,
  };
}

export function resolveEarlyGameCompletion(input: ResolveGameCompletionInput): CompletedGame {
  const standings = deriveStandings(input);
  const [first, ...tied] = standings.rows.filter((row) => row.place === 1);
  if (!first) throw new Error("Cannot finish a Game without Players in Standings");
  return createCompletedGame(input, standings.includedPlayers, "manual", [
    first.player.id,
    ...tied.map((row) => row.player.id),
  ]);
}

function createCompletedGame(
  input: ResolveGameCompletionInput,
  includedPlayers: readonly PlayerIdentity[],
  completionType: CompletedGame["completionType"],
  winnerIds: CompletedGame["winnerIds"],
): CompletedGame {
  const playerIds = includedPlayers.map((player) => player.id);
  return {
    id: input.game.id,
    scorekeeper: "phase10",
    status: "completed",
    phaseSet: input.game.phaseSet,
    players: playerIds,
    settings: input.game.settings,
    createdAt: input.game.createdAt,
    lastActivityAt: input.completedAt,
    completedAt: input.completedAt,
    completionType,
    winnerIds,
    playerSnapshots: capturePlayerSnapshots(playerIds, input.players),
  };
}
