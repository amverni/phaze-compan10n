import { createContext, type ReactNode, useContext } from "react";
import type { Player, PlayerId } from "../../types";

interface PlayerSelection {
  players: Player[];
  addPlayer: (player: Player) => void;
  removePlayer: (id: PlayerId) => void;
  reorderPlayers: (players: Player[]) => void;
}

const PlayerSelectionContext = createContext<PlayerSelection | null>(null);

export function PlayerSelectionProvider({
  value,
  children,
}: {
  value: PlayerSelection;
  children: ReactNode;
}) {
  return (
    <PlayerSelectionContext.Provider value={value}>{children}</PlayerSelectionContext.Provider>
  );
}

function usePlayerSelection() {
  const value = useContext(PlayerSelectionContext);
  if (!value) throw new Error("Player selection requires a PlayerSelectionProvider");
  return value;
}

export function useGamePlayers() {
  return usePlayerSelection().players;
}

export function useAddPlayer() {
  return usePlayerSelection().addPlayer;
}

export function useRemovePlayer() {
  return usePlayerSelection().removePlayer;
}

export function useReorderPlayers() {
  return usePlayerSelection().reorderPlayers;
}
