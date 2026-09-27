import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { HomeMenu } from "../Home/HomeMenu";
import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";
import { Button } from "../ui";
import { ActiveGenericGames } from "./ActiveGenericGames";

export function ScorekeeperHome() {
  return (
    <ScorekeeperShell
      headerContent={
        <div className="flex h-full items-center justify-end px-4">
          <HomeMenu experience="scorekeeper" />
        </div>
      }
      mainContent={
        <div className="content-container flex min-h-full flex-col items-center gap-6 py-6">
          <ScorekeeperLogo height={120} />
          <Button as={Link} to="/create" className="gap-2 px-5 py-3">
            <Plus className="size-5" aria-hidden />
            Create Game
          </Button>
          <ActiveGenericGames />
        </div>
      }
    />
  );
}
