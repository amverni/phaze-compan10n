import { ListChecks, Menu, Settings, Users } from "lucide-react";
import type React from "react";
import { Button, Popover, PopoverButton, PopoverPanel } from "../ui";

const items = [
  { label: "Players", icon: Users },
  { label: "Phases", icon: ListChecks },
  { label: "Settings", icon: Settings },
] as const;

export const HomeMenu: React.FC = () => {
  return (
    <Popover className="relative">
      <PopoverButton as={Button} aria-label="Menu" className="size-10 active:!scale-100">
        <Menu className="size-6 relative z-10" />
      </PopoverButton>

      <PopoverPanel anchor="bottom end" className="z-50 min-w-44 [--anchor-gap:8px]">
        <nav className="flex flex-col">
          {items.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Icon className="size-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </PopoverPanel>
    </Popover>
  );
};
