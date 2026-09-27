import type {
  ArrayAtLeastOne,
  GenericGame,
  GenericGameSettings,
  GenericScoreboardView,
  GenericScoreTotal,
  GenericWinnerScore,
  PlayerId,
  PlayerIdentity,
  StoredRound,
} from "../../types";
import { getDealerId } from "../../utils";

export function assertGenericSettings(settings: GenericGameSettings): void {
  if (
    !settings ||
    settings.tiebreaker !== null ||
    typeof settings.dealer !== "boolean" ||
    (settings.mode === "points"
      ? settings.pointsDirection !== "high" && settings.pointsDirection !== "low"
      : settings.mode !== "singleRoundWinner" || "pointsDirection" in settings)
  ) {
    throw new Error("Unsupported Generic Game settings");
  }
}

export function assertGenericGame(game: GenericGame): void {
  assertGenericSettings(game.settings);
  if (
    !Array.isArray(game.players) ||
    game.players.length === 0 ||
    game.players.some((id) => typeof id !== "string" || id.length === 0) ||
    new Set(game.players).size !== game.players.length
  ) {
    throw new Error("Generic Game has an invalid Player roster.");
  }
}

export function orderGenericScores<T extends { playerId: PlayerId }>(
  playerIds: PlayerId[],
  scores: T[],
): ArrayAtLeastOne<T> {
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
  }) as ArrayAtLeastOne<T>;
}

export function deriveGenericScoreboard(
  game: GenericGame,
  identities: PlayerIdentity[],
  storedRounds: StoredRound[],
): GenericScoreboardView {
  const totals = new Map(game.players.map((id) => [id, 0]));
  const rounds: GenericScoreboardView["rounds"] = [...storedRounds]
    .sort((a, b) => a.roundNumber - b.roundNumber)
    .map((round) => {
      if (round.scorekeeper !== "generic") {
        throw new Error("Round belongs to another Scorekeeper");
      }
      if (
        round.gameId !== game.id ||
        round.mode !== game.settings.mode ||
        !Number.isSafeInteger(round.roundNumber) ||
        round.roundNumber < 1
      ) {
        throw new Error("Invalid Generic Round.");
      }
      const ordered =
        round.mode === "points"
          ? orderGenericScores(game.players, round.scores).map(({ playerId, points }) => ({
              playerId,
              points,
            }))
          : orderWinnerScores(game.players, round.scores);
      return {
        roundNumber: round.roundNumber,
        dealerId: game.settings.dealer ? getDealerId(round.roundNumber, game.players) : null,
        scores: ordered.map((score) => {
          const { playerId } = score;
          const previous = totals.get(playerId);
          if (previous === undefined) throw new Error("Player does not belong to the Game");
          if ("won" in score) {
            const totalWins = previous + (score.won ? 1 : 0);
            totals.set(playerId, totalWins);
            return { playerId, won: score.won, totalWins };
          }
          const { points } = score;
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
    const total = totals.get(id);
    if (total === undefined) throw new Error("Player does not belong to the Game");
    return { id, name, color, ...scoreTotal(game.settings, total) };
  });
  const ranked = identities
    .map((player) => {
      const total = totals.get(player.id);
      if (total === undefined) throw new Error("Player does not belong to the Game");
      return { player, total };
    })
    .sort((a, b) => {
      if (a.total === b.total) return 0;
      const lower = a.total < b.total ? -1 : 1;
      return game.settings.mode === "points" && game.settings.pointsDirection === "low"
        ? lower
        : -lower;
    });
  let place = 1;
  const standings = ranked.map(({ total, player: { id, name, color } }, index) => {
    if (index > 0 && ranked[index - 1].total !== total) place = index + 1;
    return { player: { id, name, color }, ...scoreTotal(game.settings, total), place };
  });
  const nextRoundNumber = (rounds.at(-1)?.roundNumber ?? 0) + 1;
  const upcomingDealerId =
    game.status === "active" && game.settings.dealer
      ? getDealerId(nextRoundNumber, game.players)
      : null;
  return { game, players, rounds, standings, upcomingDealerId };
}

function scoreTotal(settings: GenericGameSettings, total: number): GenericScoreTotal {
  return settings.mode === "points" ? { totalPoints: total } : { totalWins: total };
}

function orderWinnerScores(playerIds: PlayerId[], scores: GenericWinnerScore[]) {
  const ordered = orderGenericScores(playerIds, scores);
  if (ordered.some((score) => typeof score.won !== "boolean")) {
    throw new Error("Round must include a valid win or loss for every Player.");
  }
  if (ordered.filter((score) => score.won).length !== 1) {
    throw new Error("A Single Round Winner Round requires exactly one winner.");
  }
  return ordered;
}
