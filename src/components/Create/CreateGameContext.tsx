import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { Player, PlayerId } from "../../types";

interface CreateGameContextValue {
  players: Player[];
  addPlayer: (player: Player) => void;
  removePlayer: (id: PlayerId) => void;
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
