import { createContext, type ReactNode, useContext, useState } from "react";
import { classicPhaseSet } from "../../data/constants/phaseSets";
import { builtInPhases } from "../../data/constants/phases";
import type { Phase, PhaseId, Player, PlayerId } from "../../types";

interface CreateGameContextValue {
  players: Player[];
  addPlayer: (player: Player) => void;
  removePlayer: (id: PlayerId) => void;
  reorderPlayers: (players: Player[]) => void;
  phases: Phase[];
  addPhase: (phase: Phase) => void;
  removePhase: (id: PhaseId) => void;
  reorderPhases: (phases: Phase[]) => void;
  setPhases: (phases: Phase[]) => void;
}

const CreateGameContext = createContext<CreateGameContextValue | null>(null);

function resolveDefaultPhases(): Phase[] {
  const phaseMap = new Map<string, Phase>(builtInPhases.map((p) => [p.id, p]));
  return classicPhaseSet.phases
    .map((id) => phaseMap.get(id))
    .filter((p): p is Phase => p !== undefined);
}

export function CreateGameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [phases, setPhases] = useState<Phase[]>(resolveDefaultPhases);

  const value: CreateGameContextValue = {
    players,
    addPlayer: (player) =>
      setPlayers((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player])),
    removePlayer: (id) => setPlayers((prev) => prev.filter((p) => p.id !== id)),
    reorderPlayers: setPlayers,
    phases,
    addPhase: (phase) =>
      setPhases((prev) => (prev.some((p) => p.id === phase.id) ? prev : [...prev, phase])),
    removePhase: (id) => setPhases((prev) => prev.filter((p) => p.id !== id)),
    reorderPhases: setPhases,
    setPhases,
  };

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

export function useGamePhases(): Phase[] {
  const { phases } = useCreateGameContext();
  return phases;
}

export function useAddPhase(): (phase: Phase) => void {
  const { addPhase } = useCreateGameContext();
  return addPhase;
}

export function useRemovePhase(): (id: PhaseId) => void {
  const { removePhase } = useCreateGameContext();
  return removePhase;
}

export function useReorderPhases(): (phases: Phase[]) => void {
  const { reorderPhases } = useCreateGameContext();
  return reorderPhases;
}

export function useSetPhases(): (phases: Phase[]) => void {
  const { setPhases } = useCreateGameContext();
  return setPhases;
}
