import type { ReactNode } from "react";
import { List } from "../ui";
import "./StandingsList.css";

export const standingsRowClasses = [
  "standings-row flex w-full min-w-0 items-center gap-1.5 text-sm",
].join(" ");

interface StandingsListProps {
  children: ReactNode;
  scorekeeper: "phase10" | "generic";
  className?: string;
}

export function StandingsList({ children, scorekeeper, className }: StandingsListProps) {
  return (
    <List
      role="list"
      aria-label="Standings places"
      emptyMessage="No players in these Standings"
      className={["standings-list", `standings-list--${scorekeeper}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </List>
  );
}
