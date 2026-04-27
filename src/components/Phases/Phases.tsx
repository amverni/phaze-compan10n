import { Tab, TabGroup, TabPanel, TabPanels } from "@headlessui/react";
import { ArrowLeft, Layers, ListChecks } from "lucide-react";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button, TabList } from "../ui";
import { PhaseSetsList } from "./PhaseSetsList";
import { PhasesList } from "./PhasesList";

const tabClasses =
  "relative z-10 flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold opacity-60 outline-none transition-all duration-200 hover:brightness-110 data-selected:opacity-100";

export function Phases() {
  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center">
          <div className="absolute inset-0 flex items-center justify-center pt-6">
            <Logo height={100} width="100%" />
          </div>
        </div>
      }
      mainContent={
        <div className="content-container h-full">
          <TabGroup className="flex h-full min-h-0 flex-col">
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
            <TabPanels className="min-h-0 flex-1">
              <TabPanel className="h-full flex flex-col">
                <PhaseSetsList />
              </TabPanel>
              <TabPanel className="h-full flex flex-col">
                <PhasesList />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button
            onClick={() => window.history.back()}
            className="size-14 p-0"
            aria-label="Go back"
          >
            <ArrowLeft className="size-8" />
          </Button>
        </div>
      }
    />
  );
}
