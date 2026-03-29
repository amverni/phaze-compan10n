import { Tab as HeadlessTab, TabList as HeadlessTabList } from "@headlessui/react";
import type { LucideIcon } from "lucide-react";
import "./TabList.css";

export type Tab = {
  /** Visible label text. */
  label: string;
  /** Optional Lucide icon shown before the label. */
  icon?: LucideIcon;
};

type TabListProps = {
  /** Tab definitions. */
  tabs: Tab[];
  /** Currently selected (controlled) index. */
  selectedIndex: number;
  /** Extra classes on the outer TabList. */
  className?: string;
};

/**
 * A frosted-glass segmented tab bar.
 *
 * Renders a Headless UI `<TabList>` with a sliding glass indicator.
 * Must be placed inside a `<TabGroup>`.
 */
export function TabList({ tabs, selectedIndex, className }: TabListProps) {
  return (
    <HeadlessTabList
      className={[
        "glass glass-tabs relative flex w-full max-w-md items-center rounded-full p-1",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Sliding glass indicator */}
      <div
        className="glass glass-tab-indicator absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-in-out"
        style={{
          width: `calc(${100 / tabs.length}% - 8px)`,
          left: `calc(${(selectedIndex * 100) / tabs.length}% + 4px)`,
        }}
        aria-hidden
      />

      {tabs.map(({ label, icon: Icon }) => (
        <HeadlessTab
          key={label}
          className="relative z-10 flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold text-white/60 outline-none transition-colors duration-200 data-selected:text-white"
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            {Icon && <Icon className="size-4" />}
            {label}
          </span>
        </HeadlessTab>
      ))}
    </HeadlessTabList>
  );
}
