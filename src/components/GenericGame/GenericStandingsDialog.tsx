import { DialogTitle, Tab, TabGroup, TabPanel } from "@headlessui/react";
import { useState } from "react";
import type { GenericScoreboardView } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { StandingsList, standingsRowClasses } from "../Standings/StandingsList";
import {
  standingsDialogTabPanelClasses,
  standingsDialogTabPanelHorizontalBleed,
} from "../Standings/standingsDialogLayout";
import {
  Button,
  Dialog,
  DialogScrollArea,
  numberCircleClasses,
  SwipeableTabPanels,
  TabList,
  tabClasses,
} from "../ui";
import { GenericResultGraph } from "./GenericResultGraph";

interface GenericStandingsDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  view: GenericScoreboardView;
}

export function GenericStandingsDialog({ open, onClose, view }: GenericStandingsDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { standings, primaryGraph, tiebreakerGraph } = view;
  const metric = primaryGraph.metric === "Rounds Won" ? "Wins" : primaryGraph.metric;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      afterLeave={() => setSelectedIndex(0)}
      className="max-w-xl"
    >
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-2 pb-4">
        <DialogTitle className="sr-only">Standings</DialogTitle>
        <TabGroup
          selectedIndex={selectedIndex}
          onChange={setSelectedIndex}
          className="flex min-h-0 flex-1 flex-col gap-3"
        >
          <TabList aria-label="Standings views">
            <Tab className={tabClasses}>Standings</Tab>
            <Tab className={tabClasses}>{primaryGraph.metric}</Tab>
            {tiebreakerGraph && <Tab className={tabClasses}>Tiebreaker</Tab>}
          </TabList>
          <SwipeableTabPanels
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            horizontalBleed={standingsDialogTabPanelHorizontalBleed}
            className="min-h-0 flex-1"
          >
            <TabPanel className={standingsDialogTabPanelClasses}>
              <DialogScrollArea aria-label={`${primaryGraph.metric} Standings`}>
                <StandingsList scorekeeper="generic">
                  {standings.map((row) => (
                    <li key={row.player.id} className={standingsRowClasses}>
                      <span className="sr-only">Place {row.place}</span>
                      <span className={numberCircleClasses} aria-hidden>
                        {row.place}
                      </span>
                      <PlayerAvatar player={row.player} size={16} variant="icon" />
                      <span className="min-w-0 flex-1 truncate font-medium" title={row.player.name}>
                        {row.player.name}
                      </span>
                      <span className="shrink-0 text-right font-semibold whitespace-nowrap tabular-nums">
                        <span className="sr-only">Total {metric}: </span>
                        {"totalPoints" in row
                          ? row.totalPoints
                          : "totalWins" in row
                            ? row.totalWins
                            : row.totalPasses}
                        {"totalTiebreaker" in row && row.totalTiebreaker !== undefined && (
                          <span className="block text-xs font-normal text-text-secondary">
                            <span className="sr-only">Total Tiebreaker: </span>
                            {row.totalTiebreaker}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </StandingsList>
              </DialogScrollArea>
            </TabPanel>
            <TabPanel className={standingsDialogTabPanelClasses}>
              <GenericResultGraph graph={primaryGraph} />
            </TabPanel>
            {tiebreakerGraph && (
              <TabPanel className={standingsDialogTabPanelClasses}>
                <GenericResultGraph graph={tiebreakerGraph} />
              </TabPanel>
            )}
          </SwipeableTabPanels>
        </TabGroup>
        <div className="mt-auto flex shrink-0 justify-end px-2 pt-2">
          <Button
            type="button"
            onClick={() => onClose(false)}
            className="min-h-11 px-5 text-sm data-focus:outline-text-secondary!"
          >
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
