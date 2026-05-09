import { CloseButton } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ListChecks, Menu, Settings, Users } from "lucide-react";
import type React from "react";
import { Popover, PopoverButton, PopoverPanel } from "../ui";

interface MenuItem {
  label: string;
  icon: LucideIcon;
  to?: string;
}

const items: MenuItem[] = [
  { label: "Players", icon: Users, to: "/players" },
  { label: "Phases", icon: ListChecks, to: "/phases" },
  { label: "Settings", icon: Settings, to: "/settings" },
];

const itemClassName =
  "flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-black/5 dark:hover:bg-white/10";

export const HomeMenu: React.FC = () => {
  return (
    <Popover className="relative">
      {/* The outer button keeps a fixed 40×40 box so Headless UI's anchored
          panel never sees a size change (which would otherwise drift the
          popover when the press-scale fires). The visible glass + icon live
          in an inner span that grows uniformly from center on press. */}
      <PopoverButton
        aria-label="Menu"
        className="relative size-10 rounded-full group cursor-pointer focus:outline-none data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-white/60"
      >
        <span className="absolute inset-0 inline-flex items-center justify-center rounded-full glass transition-transform group-hover:brightness-110 group-active:scale-110">
          <Menu className="size-6 relative z-10" />
        </span>
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
