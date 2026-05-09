import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_GAME_SETTINGS } from "../../data/constants/gameSettings";
import { originalPhaseSet } from "../../data/constants/phaseSets";
import { builtInPhases } from "../../data/constants/phases";
import { phaseSetPhasesOptions } from "../../data/hooks/usePhaseSets";
import { appSettingsOptions } from "../../data/hooks/useSettings";
import type {
  GameSettings,
  GameTiebreaker,
  Phase,
  PhaseId,
  PhaseSetId,
  Player,
  PlayerId,
} from "../../types";

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
  defaultPhaseSetId: PhaseSetId;
  settings: GameSettings;
  setTiebreaker: (tiebreaker: GameTiebreaker) => void;
}

const CreateGameContext = createContext<CreateGameContextValue | null>(null);

function resolveDefaultPhases(): Phase[] {
  const phaseMap = new Map<string, Phase>(builtInPhases.map((p) => [p.id, p]));
  return originalPhaseSet.phases
    .map((id) => phaseMap.get(id))
    .filter((p): p is Phase => p !== undefined);
}

export function CreateGameProvider({ children }: { children: ReactNode }) {
  const { data: appSettings } = useQuery(appSettingsOptions());
  const defaultPhaseSetId = appSettings?.gameDefaults.phaseSetId ?? originalPhaseSet.id;
  const { data: defaultPhases } = useQuery({
    ...phaseSetPhasesOptions(defaultPhaseSetId),
    enabled: appSettings !== undefined,
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [phases, setGamePhases] = useState<Phase[]>(resolveDefaultPhases);
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...DEFAULT_GAME_SETTINGS }));
  const initializedSettingsRef = useRef(false);
  const initializedPhasesRef = useRef(false);
  const phasesDirtyRef = useRef(false);
  const settingsDirtyRef = useRef(false);

  useEffect(() => {
    if (!appSettings || initializedSettingsRef.current || settingsDirtyRef.current) return;
    initializedSettingsRef.current = true;
    setSettings({ ...appSettings.gameDefaults });
  }, [appSettings]);

  useEffect(() => {
    if (!defaultPhases || initializedPhasesRef.current || phasesDirtyRef.current) return;
    if (defaultPhases.length === 0) return;
    initializedPhasesRef.current = true;
    setGamePhases(defaultPhases);
  }, [defaultPhases]);

  const value: CreateGameContextValue = {
    players,
    addPlayer: (player) =>
      setPlayers((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player])),
    removePlayer: (id) => setPlayers((prev) => prev.filter((p) => p.id !== id)),
    reorderPlayers: setPlayers,
    phases,
    addPhase: (phase) => {
      phasesDirtyRef.current = true;
      setGamePhases((prev) => (prev.some((p) => p.id === phase.id) ? prev : [...prev, phase]));
    },
    removePhase: (id) => {
      phasesDirtyRef.current = true;
      setGamePhases((prev) => prev.filter((p) => p.id !== id));
    },
    reorderPhases: (phases) => {
      phasesDirtyRef.current = true;
      setGamePhases(phases);
    },
    setPhases: (phases) => {
      phasesDirtyRef.current = true;
      setGamePhases(phases);
    },
    defaultPhaseSetId,
    settings,
    setTiebreaker: (tiebreaker) => {
      settingsDirtyRef.current = true;
      setSettings((prev) => ({ ...prev, tiebreaker }));
    },
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

export function useDefaultPhaseSetId(): PhaseSetId {
  const { defaultPhaseSetId } = useCreateGameContext();
  return defaultPhaseSetId;
}

export function useGameSettings(): GameSettings {
  const { settings } = useCreateGameContext();
  return settings;
}

export function useSetTiebreaker(): (tiebreaker: GameTiebreaker) => void {
  const { setTiebreaker } = useCreateGameContext();
  return setTiebreaker;
}
