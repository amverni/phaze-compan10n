import { Tab, TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Info, ListChecks, Play, Settings as SettingsIcon, Users, X } from "lucide-react";
import { useState } from "react";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button, TabList } from "../ui";
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
        <TabGroup selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <div className="content-container flex justify-center pt-2 pb-3">
            <TabList>
              {TABS.map(({ label, icon: Icon }) => (
                <Tab
                  key={label}
                  className="relative z-10 flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold opacity-60 outline-none transition-all duration-200 hover:brightness-110 data-selected:opacity-100"
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <Icon className="size-4" />
                    {label}
                  </span>
                </Tab>
              ))}
            </TabList>
          </div>

          <TabPanels className="content-container">
            <TabPanel>
              <Players />
            </TabPanel>

            <TabPanel>
              <Phases />
            </TabPanel>

            <TabPanel>
              <Settings />
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
          <Button aria-label="Start" className="size-14">
            <Play className="size-8 relative z-10" />
          </Button>
        </div>
      }
    />
  );
}
