import { useRef, useState } from "react";
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
}

const POINTS_MAX = 250;

export function useAddRoundDraft(players: Player[], settings: GameSettings): UseAddRoundDraft {
  const [draft, setDraft] = useState(() => draftHelpers.createInitialDraft(players));
  const draftRef = useRef(draft);

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
      setNextDraft(draftHelpers.applyRoundWinner(draftRef.current, playerId, settings));
    },
    clearRoundWinner: () => {
      setNextDraft({ ...draftRef.current, roundWinnerId: null });
    },
    reset: () => {
      setNextDraft(draftHelpers.createInitialDraft(players));
    },
  };
}
