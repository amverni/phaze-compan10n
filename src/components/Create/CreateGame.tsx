import { TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { Info, ListChecks, Play, Settings as SettingsIcon, Users, X } from "lucide-react";
import { useState } from "react";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button } from "../ui/Button/Button";
import { type Tab, TabList } from "../ui/TabList/TabList";
import { Phases } from "./Phases";
import { Players } from "./Players";
import { Settings } from "./Settings";

const TABS: Tab[] = [
  { label: "Players", icon: Users },
  { label: "Phases", icon: ListChecks },
  { label: "Settings", icon: SettingsIcon },
];

export function CreateGame() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center justify-end px-4">
          {/* Logo as background */}
          <div className="absolute inset-0 flex items-center justify-center pt-6">
            <Logo height={100} width="100%" />
          </div>

          {/* Info icon in normal flow, on top */}
          <Button aria-label="Tips" size="small" icon={Info} />
        </div>
      }
      mainContent={
        <TabGroup selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <div className="flex justify-center px-4 pt-2 pb-3">
            <TabList tabs={TABS} selectedIndex={selectedIndex} />
          </div>

          <TabPanels>
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
        <div className="flex h-full items-center justify-between px-6">
          {/* Cancel — back to home */}
          <Button as="link" to="/" aria-label="Cancel" icon={X} />

          {/* Start game */}
          <Button aria-label="Start" icon={Play} />
        </div>
      }
    />
  );
}
