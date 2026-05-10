import { Tab, TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Info, ListChecks, Play, Settings as SettingsIcon, Users, X } from "lucide-react";
import { useState } from "react";
import { useCreateGame } from "../../data/hooks/useGames";
import type { ArrayAtLeastOne, PhaseId, TemporaryPhaseSet } from "../../types";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button, ScrollFade, TabList } from "../ui";
import { useGamePhases, useGamePlayers, useGameSettings } from "./CreateGameContext";
import { Phases } from "./Phases";
import { Players } from "./Players";
import { Settings } from "./Settings";

const TABS: { label: string; icon: LucideIcon }[] = [
  { label: "Players", icon: Users },
  { label: "Phases", icon: ListChecks },
  { label: "Settings", icon: SettingsIcon },
];

export function CreateGame() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);
  const createGame = useCreateGame();
  const navigate = useNavigate();
  const players = useGamePlayers();
  const phases = useGamePhases();
  const settings = useGameSettings();
  const canStartGame = players.length >= 2 && phases.length >= 1 && !createGame.isPending;

  async function handleStartGame() {
    if (!canStartGame) return;

    setStartError(null);
    const phaseIds = phases.map((phase) => phase.id) as ArrayAtLeastOne<PhaseId>;
    const phaseSet: TemporaryPhaseSet = {
      id: crypto.randomUUID(),
      name: "Game Phases",
      type: "temporary",
      phases: phaseIds,
    };

    try {
      const game = await createGame.mutateAsync({
        players: players.map((player) => player.id),
        phaseSet,
        settings,
      });
      await navigate({ to: "/game", search: { gameId: game.id } });
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Unable to start game");
    }
  }

  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center justify-end">
          {/* Logo as background */}
          <div className="absolute inset-0 flex items-center justify-center pt-6">
            <Logo height={100} width="100%" />
          </div>

          {/* Info icon in normal flow, on top */}
          <div className="relative z-10 mx-auto flex h-full w-full items-center justify-end px-4">
            <Button aria-label="Tips" className="size-10">
              <Info className="size-6 relative z-10" />
            </Button>
          </div>
        </div>
      }
      mainContent={
        <TabGroup
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
          className="flex h-full min-h-0 flex-col"
        >
          <div className="content-container w-full flex shrink-0 justify-center pt-2 pb-3">
            <TabList>
              {TABS.map(({ label, icon: Icon }) => (
                <Tab
                  key={label}
                  className="relative z-10 flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold opacity-60 outline-none hover:brightness-110 data-focus:outline-2 data-focus:outline-white/60 data-selected:opacity-100"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Icon className="size-4" />
                    {label}
                  </span>
                </Tab>
              ))}
            </TabList>
          </div>

          {startError && (
            <p
              className="content-container mb-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
              role="alert"
            >
              {startError}
            </p>
          )}

          <TabPanels className="content-container w-full min-h-0 flex-1">
            <TabPanel className="h-full">
              <ScrollFade className="h-full -mx-6 px-6 pb-(--slant)">
                <Players />
              </ScrollFade>
            </TabPanel>

            <TabPanel className="h-full">
              <ScrollFade className="h-full -mx-6 px-6 pb-(--slant)">
                <Phases />
              </ScrollFade>
            </TabPanel>

            <TabPanel className="h-full">
              <ScrollFade className="h-full -mx-6 px-6 pb-(--slant)">
                <Settings />
              </ScrollFade>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      }
      footerContent={
        <div className="content-container flex h-full justify-between">
          {/* Cancel — back to home */}
          <Button as={Link} to="/" aria-label="Cancel" className="size-14">
            <X className="size-8 relative z-10" />
          </Button>

          {/* Start game */}
          <Button
            aria-label="Start"
            className="size-14"
            disabled={!canStartGame}
            onClick={handleStartGame}
          >
            <Play className="size-8 relative z-10" />
          </Button>
        </div>
      }
    />
  );
}
