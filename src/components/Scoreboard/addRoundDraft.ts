import type {
  ArrayAtLeastOne,
  GameSettings,
  GameTiebreaker,
  PhaseStatus,
  Player,
  PlayerId,
  RoundScore,
} from "../../types";

type ManualResult = Extract<PhaseStatus, "failed" | "completed">;

export type PointsQuickButtonId = "p5" | "p10" | "skipCard" | "wild";

export const POINTS_QUICK_BUTTON_DELTAS: Record<PointsQuickButtonId, number> = {
  p5: 5,
  p10: 10,
  skipCard: 15,
  wild: 25,
};

export type QuickCounts = Record<PointsQuickButtonId, number>;

const ZERO_QUICK_COUNTS: QuickCounts = { p5: 0, p10: 0, skipCard: 0, wild: 0 };

/** Per-player draft state. `result === null` means the user hasn't picked yet — submission blocked. */
export interface PlayerDraft {
  playerId: PlayerId;
  result: PhaseStatus | null;
  /** Polymorphic numeric value (semantics depend on tiebreaker — see addRound.md). */
  score: number;
  /** Snapshot of the score the user last manually set while result was failed|completed. Used to restore when toggling away from skipped/satOut. */
  lastManualScore: number;
  /** Press counts per quick-add button (points-based tiebreaker only). */
  quickCounts: QuickCounts;
  /** Whether the Round Result secondary row (Skipped / Sat Out) is currently expanded for this player. */
  expandedSecondary: boolean;
}

export interface AddRoundDraft {
  players: PlayerDraft[];
  roundWinnerId: PlayerId | null;
}

type CompleteAddRoundDraft = AddRoundDraft & {
  players: Array<PlayerDraft & { result: PhaseStatus }>;
};

type PenaltySettings = Pick<GameSettings, "roundSkipPenalty" | "sitOutPenalty">;

function isManualResult(result: PhaseStatus | null): result is ManualResult {
  return result === "failed" || result === "completed";
}

function updatePlayer(
  draft: AddRoundDraft,
  playerId: PlayerId,
  update: (player: PlayerDraft) => PlayerDraft,
): AddRoundDraft {
  return {
    ...draft,
    players: draft.players.map((player) =>
      player.playerId === playerId ? update(player) : player,
    ),
  };
}

export function createInitialDraft(players: Player[]): AddRoundDraft {
  return {
    players: players.map((p) => ({
      playerId: p.id,
      result: null,
      score: 0,
      lastManualScore: 0,
      quickCounts: { ...ZERO_QUICK_COUNTS },
      expandedSecondary: false,
    })),
    roundWinnerId: null,
  };
}

/**
 * Update a player's Round Result.
 *
 * Behavior:
 * - If new result is "skipped" → set score to settings.roundSkipPenalty.
 *   (Save current score as lastManualScore IFF the OLD result was "failed" or "completed".)
 * - If new result is "satOut" → set score to settings.sitOutPenalty.
 *   (Same snapshot rule.)
 * - If new result is "failed" or "completed" → restore score from lastManualScore.
 * - If new result is no longer "completed" AND the player is the current roundWinnerId →
 *   clear roundWinnerId (downgrade clears winner).
 */
export function applyResult(
  draft: AddRoundDraft,
  playerId: PlayerId,
  result: PhaseStatus,
  settings: PenaltySettings,
): AddRoundDraft {
  const updated = updatePlayer(draft, playerId, (player) => {
    const lastManualScore = isManualResult(player.result) ? player.score : player.lastManualScore;
    const quickCounts = isManualResult(result) ? player.quickCounts : { ...ZERO_QUICK_COUNTS };

    if (result === "skipped") {
      return {
        ...player,
        result,
        score: settings.roundSkipPenalty,
        lastManualScore,
        quickCounts,
      };
    }

    if (result === "satOut") {
      return {
        ...player,
        result,
        score: settings.sitOutPenalty,
        lastManualScore,
        quickCounts,
      };
    }

    return {
      ...player,
      result,
      score: player.lastManualScore,
      quickCounts,
    };
  });

  if (result !== "completed" && draft.roundWinnerId === playerId) {
    return {
      ...updated,
      roundWinnerId: null,
    };
  }

  return updated;
}

/**
 * Update a player's tiebreaker score (the polymorphic numeric value). Only writable when result ∈ {failed, completed}.
 * If result is skipped/satOut, this is a no-op (UI should be greyed). Always updates lastManualScore.
 */
export function applyScore(draft: AddRoundDraft, playerId: PlayerId, score: number): AddRoundDraft {
  return updatePlayer(draft, playerId, (player) => {
    if (!isManualResult(player.result)) {
      return player;
    }

    return {
      ...player,
      score,
      lastManualScore: score,
    };
  });
}

/**
 * Increment a points-based quick-add button. Adds its delta to the wheel score and bumps the
 * per-button press count. Bound by `max`. No-op if the player's result is Skipped / Sat Out.
 */
export function applyQuickIncrement(
  draft: AddRoundDraft,
  playerId: PlayerId,
  button: PointsQuickButtonId,
  max: number,
): AddRoundDraft {
  return updatePlayer(draft, playerId, (player) => {
    if (!isManualResult(player.result)) {
      return player;
    }
    const delta = POINTS_QUICK_BUTTON_DELTAS[button];
    const nextScore = Math.min(max, player.score + delta);
    return {
      ...player,
      score: nextScore,
      lastManualScore: nextScore,
      quickCounts: { ...player.quickCounts, [button]: player.quickCounts[button] + 1 },
    };
  });
}

/** Toggle the Round Result secondary row's expanded state for a single player. */
export function applyExpandedSecondary(
  draft: AddRoundDraft,
  playerId: PlayerId,
  expanded: boolean,
): AddRoundDraft {
  return updatePlayer(draft, playerId, (player) => ({
    ...player,
    expandedSecondary: expanded,
  }));
}

/**
 * Set the Round Winner. If the target player's result is not "completed", auto-promote them
 * (set result to "completed" + restore lastManualScore) BEFORE recording the winner.
 * Returns the new draft AND a side-channel flag `autoPromoted: boolean` so the UI can render the inline note.
 */
export function applyRoundWinner(
  draft: AddRoundDraft,
  playerId: PlayerId,
  settings: PenaltySettings,
): { draft: AddRoundDraft; autoPromoted: boolean } {
  const player = draft.players.find((candidate) => candidate.playerId === playerId);
  if (!player) {
    return { draft, autoPromoted: false };
  }

  const autoPromoted = player.result !== "completed";
  const promotedDraft = autoPromoted ? applyResult(draft, playerId, "completed", settings) : draft;

  return {
    draft: {
      ...promotedDraft,
      roundWinnerId: playerId,
    },
    autoPromoted,
  };
}

/** Validation: every player has a non-null result, and if any "completed" exists, roundWinnerId points to a "completed" player. */
export function isDraftComplete(draft: AddRoundDraft): draft is CompleteAddRoundDraft {
  if (draft.players.length === 0 || draft.players.some((player) => player.result === null)) {
    return false;
  }

  const completedPlayers = draft.players.filter((player) => player.result === "completed");
  if (completedPlayers.length === 0) {
    return draft.roundWinnerId === null;
  }

  return completedPlayers.some((player) => player.playerId === draft.roundWinnerId);
}

/**
 * Build the array of `Omit<RoundScore, "currentPhase">` for `roundsApi.add` from the draft.
 * Throws if !isDraftComplete(draft). The `score.score` field is the polymorphic value
 * (points / wilds / skip-card-count) chosen by the wheel; for tiebreaker = "roundsWon"
 * the value is ignored by the scoreboard reader but we still write it (preserves the polymorphic contract).
 *
 * NOTE: `currentPhase` is omitted because `roundsApi.add` computes it.
 */
export function toRoundScores(
  draft: AddRoundDraft,
  _tiebreaker: GameTiebreaker,
): ArrayAtLeastOne<Omit<RoundScore, "currentPhase">> {
  if (!isDraftComplete(draft)) {
    throw new Error("Cannot build round scores from an incomplete draft.");
  }

  return draft.players.map((player) => ({
    playerId: player.playerId,
    score: player.score,
    phaseStatus: player.result,
  })) as ArrayAtLeastOne<Omit<RoundScore, "currentPhase">>;
}
