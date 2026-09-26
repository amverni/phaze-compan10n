import { Tab, TabGroup, TabPanel } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Layers, ListChecks } from "lucide-react";
import { useState } from "react";
import { CardBackground } from "../CardBackground/CardBackground";
import { HeaderLogo } from "../Logo/HeaderLogo";
import { Button, SwipeableTabPanels, TabList, tabClasses } from "../ui";
import { PhaseSetsList } from "./PhaseSetsList";
import { PhasesList } from "./PhasesList";

const tabPanelHorizontalBleed = 24;

export function Phases() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center">
          <HeaderLogo />
        </div>
      }
      mainContent={
        <div className="content-container h-full">
          <TabGroup
            selectedIndex={selectedIndex}
            onChange={setSelectedIndex}
            className="flex h-full min-h-0 flex-col"
          >
            <div className="flex shrink-0 justify-center pt-2 pb-3">
              <TabList>
                <Tab className={tabClasses}>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Layers className="size-4" />
                    Phase Sets
                  </span>
                </Tab>
                <Tab className={tabClasses}>
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <ListChecks className="size-4" />
                    Phases
                  </span>
                </Tab>
              </TabList>
            </div>
            <SwipeableTabPanels
              selectedIndex={selectedIndex}
              onChange={setSelectedIndex}
              horizontalBleed={tabPanelHorizontalBleed}
              className="min-h-0 flex-1"
            >
              <TabPanel className="h-full flex flex-col">
                <PhaseSetsList />
              </TabPanel>
              <TabPanel className="h-full flex flex-col">
                <PhasesList />
              </TabPanel>
            </SwipeableTabPanels>
          </TabGroup>
        </div>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button as={Link} to="/" className="card-footer-button p-0" aria-label="Go home">
            <ArrowLeft className="size-8" />
          </Button>
        </div>
      }
    />
  );
}
