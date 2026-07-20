import type { PhaseStatus, PlayerProgress, RoundScore } from "../types";

export function getInitialPlayerProgress(): PlayerProgress {
  return {
    currentPhase: 1,
    isFinished: false,
    standingValue: 1,
  };
}

export function phaseStatusAdvances(phaseStatus: PhaseStatus): boolean {
  return phaseStatus === "completed" || phaseStatus === "skipped";
}

export function getNextCurrentPhase(
  previousScore: Pick<RoundScore, "currentPhase" | "phaseStatus"> | undefined,
  totalPhases: number,
): number {
  if (!previousScore) return 1;

  const nextPhase = phaseStatusAdvances(previousScore.phaseStatus)
    ? previousScore.currentPhase + 1
    : previousScore.currentPhase;
  return Math.min(Math.max(nextPhase, 1), totalPhases);
}

export function getProgressAfterScore(
  score: RoundScore,
  previousProgress: PlayerProgress,
  totalPhases: number,
): PlayerProgress {
  if (previousProgress.isFinished) return previousProgress;

  const advances = phaseStatusAdvances(score.phaseStatus);
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
