import { CloseButton } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ListChecks, Menu, Settings, Users } from "lucide-react";
import type React from "react";
import { Button, Popover, PopoverButton, PopoverPanel } from "../ui";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  to?: string;
}

const items: MenuItem[] = [
  { label: "Players", icon: Users, to: "/players" },
  { label: "Phases", icon: ListChecks },
  { label: "Settings", icon: Settings },
];

const itemClassName =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10";

export const HomeMenu: React.FC = () => {
  return (
    <Popover className="relative">
      <PopoverButton as={Button} aria-label="Menu" className="size-10 active:scale-100!">
        <Menu className="size-6 relative z-10" />
      </PopoverButton>

      <PopoverPanel anchor="bottom end" className="z-50 min-w-44 [--anchor-gap:8px]">
        <nav className="flex flex-col">
          {items.map(({ label, icon: Icon, to }) =>
            to ? (
              <CloseButton key={label} as={Link} to={to} className={itemClassName}>
                <Icon className="size-5 shrink-0" />
                {label}
              </CloseButton>
            ) : (
              <CloseButton key={label} as="button" type="button" className={itemClassName}>
                <Icon className="size-5 shrink-0" />
                {label}
              </CloseButton>
            ),
          )}
        </nav>
      </PopoverPanel>
    </Popover>
  );
};
