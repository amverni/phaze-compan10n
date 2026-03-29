import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Info, Play, X } from "lucide-react";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button } from "../ui/Button/Button";
import { Phases } from "./Phases";
import { Players } from "./Players";
import { Settings } from "./Settings";

const TABS = ["Players", "Phases", "Settings"] as const;

export function CreateGame() {
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
        <TabGroup>
          <TabList>
            {TABS.map((label) => (
              <Tab key={label}>{label}</Tab>
            ))}
          </TabList>

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
