import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { GameId } from "../../types";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button } from "../ui";

interface GameProps {
  gameId: GameId;
}

export function Game(_props: GameProps) {
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
        <div className="content-container flex h-full items-center justify-center py-4">
          <p className="text-text-secondary">Game page coming soon</p>
        </div>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button as={Link} to="/" className="size-14 p-0" aria-label="Go home">
            <ArrowLeft className="size-8" />
          </Button>
        </div>
      }
    />
  );
}
