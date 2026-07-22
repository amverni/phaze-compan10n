import type { ActiveGame, CompletedGame, Game, GameSettings } from "../../types";
import { normalizeGameSettings } from "../constants/gameSettings";

export type LegacyActiveGame = Omit<ActiveGame, "settings" | "lastActivityAt"> & {
  settings?: Partial<GameSettings>;
  lastActivityAt?: number;
};

export type LegacyCompletedGame = Omit<CompletedGame, "settings" | "lastActivityAt"> & {
  settings?: Partial<GameSettings>;
  lastActivityAt?: number;
};

export type LegacyGame = LegacyActiveGame | LegacyCompletedGame;

export function withGameDefaults(game: LegacyGame): Game {
  const settings = normalizeGameSettings(game.settings);
  const lastActivityAt = game.lastActivityAt ?? game.createdAt;

  if (game.status === "active") return { ...game, settings, lastActivityAt };
  return { ...game, settings, lastActivityAt };
}
