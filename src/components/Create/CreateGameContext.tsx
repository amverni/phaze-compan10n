import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { Player, PlayerId } from "../../types";

interface CreateGameContextValue {
  players: Player[];
  addPlayer: (player: Player) => void;
  removePlayer: (id: PlayerId) => void;
  reorderPlayers: (players: Player[]) => void;
}

const CreateGameContext = createContext<CreateGameContextValue | null>(null);

export function CreateGameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);

  const value = useMemo<CreateGameContextValue>(
    () => ({
      players,
      addPlayer: (player) =>
        setPlayers((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player])),
      removePlayer: (id) => setPlayers((prev) => prev.filter((p) => p.id !== id)),
      reorderPlayers: setPlayers,
    }),
    [players],
  );

  return <CreateGameContext.Provider value={value}>{children}</CreateGameContext.Provider>;
}

function useCreateGameContext(): CreateGameContextValue {
  const ctx = useContext(CreateGameContext);
  if (!ctx) throw new Error("useCreateGame must be used within a CreateGameProvider");
  return ctx;
}

export function useGamePlayers(): Player[] {
  const { players } = useCreateGameContext();
  return players;
}

export function useAddPlayer(): (player: Player) => void {
  const { addPlayer } = useCreateGameContext();
  return addPlayer;
}

export function useRemovePlayer(): (id: PlayerId) => void {
  const { removePlayer } = useCreateGameContext();
  return removePlayer;
}

export function useReorderPlayers(): (players: Player[]) => void {
  const { reorderPlayers } = useCreateGameContext();
  return reorderPlayers;
}
