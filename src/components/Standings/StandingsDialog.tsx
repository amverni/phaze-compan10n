import { Tab, TabGroup, TabPanel } from "@headlessui/react";
import { useEffect, useState } from "react";
import { deriveStandings } from "../../data/api/standings";
import type { Game, Player, Round } from "../../types";
import { Dialog, List, SwipeableTabPanels, TabList, tabClasses } from "../ui";
import { PhaseGraph } from "./PhaseGraph";
import { StandingsRow } from "./StandingsRow";
import {
  standingsDialogTabPanelClasses,
  standingsDialogTabPanelHorizontalBleed,
} from "./standingsDialogLayout";
import { getStandingsDisplayRows } from "./standingsDialogView";
import { TiebreakerGraph } from "./TiebreakerGraph";

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
              <PhaseGraph
                series={standings.phaseGraphSeries}
                rows={standings.rows}
                totalPhases={game.phaseSet.phases.length}
              />
            </TabPanel>

            <TabPanel className={standingsDialogTabPanelClasses}>
              <TiebreakerGraph
                series={standings.tiebreakerGraphSeries}
                tiebreaker={game.settings.tiebreaker}
                rounds={rounds}
              />
            </TabPanel>
          </SwipeableTabPanels>
        </TabGroup>
      </div>
    </Dialog>
  );
}
