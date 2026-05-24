import { useEffect, useRef, useState } from "react";
import type { GameSettings, PhaseStatus, Player, PlayerId } from "../../types";
import * as draftHelpers from "./addRoundDraft";

export interface UseAddRoundDraft {
  draft: draftHelpers.AddRoundDraft;
  setResult: (playerId: PlayerId, result: PhaseStatus) => void;
  setScore: (playerId: PlayerId, score: number) => void;
  incrementQuick: (playerId: PlayerId, button: draftHelpers.PointsQuickButtonId) => void;
  setExpandedSecondary: (playerId: PlayerId, expanded: boolean) => void;
  setRoundWinner: (playerId: PlayerId) => void;
  clearRoundWinner: () => void;
  reset: () => void;
  /** True for ~3s after the most recent auto-promote, so the UI can render the inline note. */
  recentAutoPromotedPlayerId: PlayerId | null;
}

const POINTS_MAX = 250;

export function useAddRoundDraft(players: Player[], settings: GameSettings): UseAddRoundDraft {
  const [draft, setDraft] = useState(() => draftHelpers.createInitialDraft(players));
  const draftRef = useRef(draft);
  const [recentAutoPromotedPlayerId, setRecentAutoPromotedPlayerId] = useState<PlayerId | null>(
    null,
  );
  const clearAutoPromotedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoPromotedTimeout = () => {
    if (clearAutoPromotedTimeoutRef.current !== null) {
      clearTimeout(clearAutoPromotedTimeoutRef.current);
      clearAutoPromotedTimeoutRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (clearAutoPromotedTimeoutRef.current !== null) {
        clearTimeout(clearAutoPromotedTimeoutRef.current);
      }
    },
    [],
  );

  const setNextDraft = (nextDraft: draftHelpers.AddRoundDraft) => {
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  };

  return {
    draft,
    setResult: (playerId, result) => {
      setNextDraft(draftHelpers.applyResult(draftRef.current, playerId, result, settings));
    },
    setScore: (playerId, score) => {
      setNextDraft(draftHelpers.applyScore(draftRef.current, playerId, score));
    },
    incrementQuick: (playerId, button) => {
      setNextDraft(
        draftHelpers.applyQuickIncrement(draftRef.current, playerId, button, POINTS_MAX),
      );
    },
    setExpandedSecondary: (playerId, expanded) => {
      setNextDraft(draftHelpers.applyExpandedSecondary(draftRef.current, playerId, expanded));
    },
    setRoundWinner: (playerId) => {
      const result = draftHelpers.applyRoundWinner(draftRef.current, playerId, settings);
      setNextDraft(result.draft);

      clearAutoPromotedTimeout();
      if (result.autoPromoted) {
        setRecentAutoPromotedPlayerId(playerId);
        clearAutoPromotedTimeoutRef.current = setTimeout(() => {
          setRecentAutoPromotedPlayerId(null);
          clearAutoPromotedTimeoutRef.current = null;
        }, 3000);
      } else {
        setRecentAutoPromotedPlayerId(null);
      }
    },
    clearRoundWinner: () => {
      setNextDraft({ ...draftRef.current, roundWinnerId: null });
    },
    reset: () => {
      clearAutoPromotedTimeout();
      setRecentAutoPromotedPlayerId(null);
      setNextDraft(draftHelpers.createInitialDraft(players));
    },
    recentAutoPromotedPlayerId,
  };
}
