import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../Logo/Logo";
import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";
import { Button } from "../ui";

const choiceClasses = ["w-full overflow-hidden rounded-2xl! px-4 py-6"].join(" ");

export function Scorekeepers() {
  return (
    <ScorekeeperShell
      headerContent={
        <h1 className="content-container flex h-full items-center text-2xl font-semibold">
          Scorekeepers
        </h1>
      }
      mainContent={
        <nav
          aria-label="Scorekeepers"
          className="content-container flex w-full flex-col gap-6 px-6 py-6"
        >
          <Button as={Link} to="/" aria-label="Scorekeeper" className={choiceClasses}>
            <ScorekeeperLogo height={80} />
          </Button>
          <Button
            as={Link}
            to="/phaseCompan10n"
            aria-label="Phase Compan10n"
            className={choiceClasses}
          >
            <Logo height={120} width="100%" fitToContainer />
          </Button>
        </nav>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button as={Link} to="/" className="page-shell-footer-button p-0" aria-label="Go home">
            <ArrowLeft className="size-8" aria-hidden="true" />
          </Button>
        </div>
      }
    />
  );
}
