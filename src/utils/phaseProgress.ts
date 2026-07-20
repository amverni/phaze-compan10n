import type { PlayerProgress, RoundScore } from "../types";

export function getInitialPlayerProgress(): PlayerProgress {
  return {
    currentPhase: 1,
    isFinished: false,
    standingValue: 1,
  };
}

export function getProgressAfterScore(
  score: RoundScore,
  previousProgress: PlayerProgress,
  totalPhases: number,
): PlayerProgress {
  if (previousProgress.isFinished) return previousProgress;

  const advances = score.phaseStatus === "completed" || score.phaseStatus === "skipped";
  const attemptedPhase = Math.max(score.currentPhase, previousProgress.currentPhase);
  const nextPhase = advances ? attemptedPhase + 1 : attemptedPhase;
  const currentPhase = Math.min(Math.max(nextPhase, 1), totalPhases);
  const isFinished = nextPhase > totalPhases;

  return {
    currentPhase,
    isFinished,
    standingValue: isFinished ? totalPhases + 1 : currentPhase,
  };
}
