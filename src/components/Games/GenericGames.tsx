import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";
import { Button } from "../ui";
import { GenericGamesList } from "./GenericGamesList";

export function GenericGames() {
  return (
    <ScorekeeperShell
      mainContent={
        <div className="content-container flex h-full min-h-0 flex-col py-4">
          <GenericGamesList />
        </div>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button
            as={Link}
            to="/scorekeeper"
            aria-label="Go home"
            className="page-shell-button p-0"
          >
            <ArrowLeft className="size-8" aria-hidden />
          </Button>
        </div>
      }
    />
  );
}
