import type { Game } from "../../types";

export function shouldShowPhasesCardEntryButton(status: Game["status"]): boolean {
  return status === "active";
}
