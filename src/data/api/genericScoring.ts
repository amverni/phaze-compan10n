import type {
  ArrayAtLeastOne,
  GenericGame,
  GenericPointsScore,
  GenericPointsSettings,
  GenericScoreboardView,
  PlayerId,
  PlayerIdentity,
  StoredRound,
} from "../../types";
import { getDealerId } from "../../utils";

export function assertGenericPointsSettings(settings: GenericPointsSettings): void {
  if (
    settings?.mode !== "points" ||
    (settings.pointsDirection !== "high" && settings.pointsDirection !== "low") ||
    settings.tiebreaker !== null ||
    typeof settings.dealer !== "boolean"
  ) {
    throw new Error("Unsupported Generic Game settings");
  }
}

export function assertGenericPointsGame(game: GenericGame): void {
  assertGenericPointsSettings(game.settings);
  if (
    !Array.isArray(game.players) ||
    game.players.length === 0 ||
    game.players.some((id) => typeof id !== "string" || id.length === 0) ||
    new Set(game.players).size !== game.players.length
  ) {
    throw new Error("Generic Game has an invalid Player roster.");
  }
}

export function orderGenericScores(
  playerIds: PlayerId[],
  scores: GenericPointsScore[],
): ArrayAtLeastOne<GenericPointsScore> {
  if (
    playerIds.length === 0 ||
    !Array.isArray(scores) ||
    scores.length !== playerIds.length ||
    new Set(scores.map((score) => score?.playerId)).size !== playerIds.length
  ) {
    throw new Error("A Round must include every Player exactly once.");
  }
  const byPlayer = new Map(scores.map((score) => [score?.playerId, score]));
  // The nonempty roster and per-Player checks guarantee a nonempty result.
  return playerIds.map((id) => {
    const score = byPlayer.get(id);
    if (!score) throw new Error("A Round must include every Player exactly once.");
    return score;
  }) as ArrayAtLeastOne<GenericPointsScore>;
}

export function deriveGenericScoreboard(
  game: GenericGame,
  identities: PlayerIdentity[],
  storedRounds: StoredRound[],
): GenericScoreboardView {
  const totals = new Map(game.players.map((id) => [id, 0]));
  const rounds = [...storedRounds]
    .sort((a, b) => a.roundNumber - b.roundNumber)
    .map((round) => {
      if (round.scorekeeper !== "generic") {
        throw new Error("Round belongs to another Scorekeeper");
      }
      if (
        round.gameId !== game.id ||
        round.mode !== "points" ||
        !Number.isSafeInteger(round.roundNumber) ||
        round.roundNumber < 1
      ) {
        throw new Error("Invalid Generic Points Round.");
      }
      return {
        roundNumber: round.roundNumber,
        dealerId: game.settings.dealer ? getDealerId(round.roundNumber, game.players) : null,
        scores: orderGenericScores(game.players, round.scores).map(({ playerId, points }) => {
          const previous = totals.get(playerId);
          if (previous === undefined) throw new Error("Player does not belong to the Game");
          if (!Number.isSafeInteger(points)) throw new Error("Round contains invalid Points.");
          const exactTotal = BigInt(previous) + BigInt(points);
          if (
            exactTotal < BigInt(Number.MIN_SAFE_INTEGER) ||
            exactTotal > BigInt(Number.MAX_SAFE_INTEGER)
          ) {
            throw new Error("Total Points must be between -9007199254740991 and 9007199254740991.");
          }
          const totalPoints = Number(exactTotal);
          totals.set(playerId, totalPoints);
          return { playerId, points, totalPoints };
        }),
      };
    });
  const players = identities.map(({ id, name, color }) => {
    const totalPoints = totals.get(id);
    if (totalPoints === undefined) throw new Error("Player does not belong to the Game");
    return { id, name, color, totalPoints };
  });
  const ranked = [...players].sort((a, b) => {
    if (a.totalPoints === b.totalPoints) return 0;
    const lower = a.totalPoints < b.totalPoints ? -1 : 1;
    return game.settings.pointsDirection === "low" ? lower : -lower;
  });
  let place = 1;
  const standings = ranked.map(({ totalPoints, ...player }, index) => {
    if (index > 0 && ranked[index - 1].totalPoints !== totalPoints) place = index + 1;
    return { player, totalPoints, place };
  });
  const nextRoundNumber = (rounds.at(-1)?.roundNumber ?? 0) + 1;
  const upcomingDealerId =
    game.status === "active" && game.settings.dealer
      ? getDealerId(nextRoundNumber, game.players)
      : null;
  return { game, players, rounds, standings, upcomingDealerId };
}
