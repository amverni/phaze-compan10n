import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import type { PlayerId } from "../../types";

interface CreateGameContextValue {
  playerIds: PlayerId[];
  addPlayer: (id: PlayerId) => void;
  removePlayer: (id: PlayerId) => void;
}

const CreateGameContext = createContext<CreateGameContextValue | null>(null);

export function CreateGameProvider({ children }: { children: ReactNode }) {
  const [playerIds, setPlayerIds] = useState<PlayerId[]>([]);

  const value = useMemo<CreateGameContextValue>(
    () => ({
      playerIds,
      addPlayer: (id) => setPlayerIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      removePlayer: (id) => setPlayerIds((prev) => prev.filter((pid) => pid !== id)),
    }),
    [playerIds],
  );

  return <CreateGameContext.Provider value={value}>{children}</CreateGameContext.Provider>;
}

function useCreateGameContext(): CreateGameContextValue {
  const ctx = useContext(CreateGameContext);
  if (!ctx) throw new Error("useCreateGame must be used within a CreateGameProvider");
  return ctx;
}

export function useGamePlayers(): PlayerId[] {
  const { playerIds } = useCreateGameContext();
  return playerIds;
}
