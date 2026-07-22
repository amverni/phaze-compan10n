import type { Player, StandingsDerivation } from "../../types";

export interface StandingsDisplayRow {
  player: Player;
  place: number;
  showPlace: boolean;
  phaseNumber: number;
  isFinished: boolean;
  tiebreakerText: string;
}

export function getStandingsDisplayRows(standings: StandingsDerivation): StandingsDisplayRow[] {
  return standings.rows.map((row) => ({
    player: row.player,
    place: row.place,
    showPlace: row.showPlace,
    phaseNumber: row.progress.currentPhase,
    isFinished: row.progress.isFinished,
    tiebreakerText: row.formattedTiebreaker,
  }));
}
