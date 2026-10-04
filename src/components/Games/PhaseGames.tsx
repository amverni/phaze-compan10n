import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CardBackground } from "../CardBackground/CardBackground";
import { HeaderLogo } from "../Logo/HeaderLogo";
import { Button } from "../ui";
import { PhaseGamesList } from "./PhaseGamesList";

export function PhaseGames() {
  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center">
          <HeaderLogo />
        </div>
      }
      mainContent={
        <div className="content-container h-full">
          <PhaseGamesList />
        </div>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button
            as={Link}
            to="/phaseCompan10n"
            className="page-shell-button p-0"
            aria-label="Go home"
          >
            <ArrowLeft className="size-8" aria-hidden />
          </Button>
        </div>
      }
    />
  );
}
