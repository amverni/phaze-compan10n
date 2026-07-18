import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { gameDetailOptions } from "../../data/hooks/useGames";
import { playersByIdsOptions } from "../../data/hooks/usePlayers";
import { roundsListOptions } from "../../data/hooks/useRounds";
import type { GameId } from "../../types";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import {
  PhasesCardDialog,
  PhasesCardEntryButtonContent,
  phasesCardEntryButtonClasses,
} from "../PhasesCard";
import { Scoreboard } from "../Scoreboard";
import { Button } from "../ui";

interface GameProps {
  gameId: GameId;
}

export function Game({ gameId }: GameProps) {
  const [phasesCardOpen, setPhasesCardOpen] = useState(false);
  const { data: game } = useQuery(gameDetailOptions(gameId));
  const playerIds = game?.players ?? [];
  const { data: players } = useQuery(playersByIdsOptions(playerIds));
  const { data: rounds } = useQuery(roundsListOptions(gameId));

  return (
    <>
      <CardBackground
        headerContent={
          <div className="relative flex h-full items-center">
            <div className="absolute inset-0 flex items-center justify-center pt-6">
              <Logo height={100} width="100%" />
            </div>
            <div className="relative z-10 mx-auto flex h-full w-full items-center px-4">
              <Button
                type="button"
                aria-label="Open Phases Card"
                className={phasesCardEntryButtonClasses}
                disabled={!game}
                onClick={() => {
                  if (game) setPhasesCardOpen(true);
                }}
              >
                <PhasesCardEntryButtonContent />
              </Button>
            </div>
          </div>
        }
        mainContent={
          <div className="content-container flex h-full min-h-0 flex-col py-4 pb-[calc(0.5rem+var(--slant))]">
            {game && players && rounds ? (
              <div className="min-h-0 flex-1">
                <Scoreboard game={game} rounds={rounds} players={players} />
              </div>
            ) : (
              <p className="text-text-secondary flex flex-1 items-center justify-center text-center">
                Loading…
              </p>
            )}
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
      {game && (
        <PhasesCardDialog
          open={phasesCardOpen}
          onClose={setPhasesCardOpen}
          phaseSet={game.phaseSet}
        />
      )}
    </>
  );
}
