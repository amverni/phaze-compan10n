import { DialogTitle, Tab, TabGroup, TabPanel } from "@headlessui/react";
import { Check, Clock3, LineChart } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { deriveStandings } from "../../data/api/standings";
import type { Game, Player, Round } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { Dialog, List, numberCircleClasses, SwipeableTabPanels, TabList, tabClasses } from "../ui";
import {
  standingsDialogTabPanelClasses,
  standingsDialogTabPanelHorizontalBleed,
} from "./standingsDialogLayout";
import { getStandingsDisplayRows } from "./standingsDialogView";

interface StandingsDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  game: Game;
  players: Player[];
  rounds: Round[];
}

export function StandingsDialog({ open, onClose, game, players, rounds }: StandingsDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const standings = deriveStandings({ game, players, rounds });
  const displayRows = getStandingsDisplayRows(standings);

  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl">
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-2 pb-3 text-text-primary">
        <div className="shrink-0">
          <DialogTitle className="text-center text-xl font-semibold">Standings</DialogTitle>
          <p className="mt-1 text-center text-sm text-text-secondary">
            Current places for this Game
          </p>
        </div>

        <TabGroup
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <div className="flex shrink-0 justify-center">
            <TabList>
              <Tab className={tabClasses}>Standings</Tab>
              <Tab className={tabClasses}>Phases</Tab>
              <Tab className={tabClasses}>Tiebreaker</Tab>
            </TabList>
          </div>

          <SwipeableTabPanels
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            horizontalBleed={standingsDialogTabPanelHorizontalBleed}
            className="min-h-0 flex-1"
          >
            <TabPanel className={standingsDialogTabPanelClasses}>
              <List
                aria-label="Standings"
                role="region"
                scrollable
                tabIndex={0}
                emptyMessage="No players in these Standings"
                className="h-full rounded-2xl"
              >
                {displayRows.map((row) => (
                  <StandingsRow key={row.player.id} row={row} />
                ))}
              </List>
            </TabPanel>

            <TabPanel className={standingsDialogTabPanelClasses}>
              <DeferredGraphTab
                icon={<LineChart className="size-6" aria-hidden />}
                title="Phases graph coming soon"
                description="The phase-over-time graph is planned for the next Standings ticket."
              />
            </TabPanel>

            <TabPanel className={standingsDialogTabPanelClasses}>
              <DeferredGraphTab
                icon={<Clock3 className="size-6" aria-hidden />}
                title="Tiebreaker graph coming soon"
                description="The cumulative Tiebreaker graph is planned for a downstream Standings ticket."
              />
            </TabPanel>
          </SwipeableTabPanels>
        </TabGroup>
      </div>
    </Dialog>
  );
}

interface StandingsRowProps {
  row: ReturnType<typeof getStandingsDisplayRows>[number];
}

function StandingsRow({ row }: StandingsRowProps) {
  const placeClasses = [numberCircleClasses, !row.showPlace && "opacity-0"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex w-full min-w-0 items-center gap-3 text-sm">
      <span className="sr-only">
        {row.showPlace ? `Place ${row.place}` : `Tied for place ${row.place}`}
      </span>
      <span className={placeClasses} aria-hidden>
        {row.place}
      </span>
      <PlayerAvatar player={row.player} size={16} variant="icon" />
      <span className="min-w-0 flex-1 truncate font-medium" title={row.player.name}>
        {row.player.name}
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-right tabular-nums">
        <span className="inline-flex items-center gap-0.5 font-semibold text-text-primary">
          Ph {row.phaseNumber}
          {row.isFinished && <Check className="size-3.5 text-pt-green-500" aria-label="Finished" />}
        </span>
        <span className="text-text-secondary">-</span>
        <span className="text-text-secondary">{row.tiebreakerText}</span>
      </span>
    </div>
  );
}

interface DeferredGraphTabProps {
  icon: ReactNode;
  title: string;
  description: string;
}

function DeferredGraphTab({ icon, title, description }: DeferredGraphTabProps) {
  return (
    <div className="glass flex h-full flex-col items-center justify-center rounded-2xl px-6 text-center">
      <div className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-text-secondary/10 text-text-secondary">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-text-secondary">{description}</p>
    </div>
  );
}
