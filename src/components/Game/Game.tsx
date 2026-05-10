import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { gameDetailOptions } from "../../data/hooks/useGames";
import { phasesByIdsOptions } from "../../data/hooks/usePhases";
import { playersByIdsOptions } from "../../data/hooks/usePlayers";
import type { GameId } from "../../types";
import { formatPhaseDisplayName } from "../../utils";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button, InlineError, List, ScrollFade } from "../ui";

interface GameProps {
  gameId: GameId;
}

export function Game({ gameId }: GameProps) {
  const {
    data: game,
    isLoading: gameLoading,
    isError: gameIsError,
    refetch: refetchGame,
  } = useQuery(gameDetailOptions(gameId));
  const {
    data: players,
    isLoading: playersLoading,
    isError: playersIsError,
    refetch: refetchPlayers,
  } = useQuery({
    ...playersByIdsOptions(game?.players ?? []),
    enabled: !!game && game.players.length > 0,
  });
  const {
    data: phases,
    isLoading: phasesLoading,
    isError: phasesIsError,
    refetch: refetchPhases,
  } = useQuery({
    ...phasesByIdsOptions(game?.phaseSet.phases ?? []),
    enabled: !!game && game.phaseSet.phases.length > 0,
  });

  const isLoading = gameLoading || playersLoading || phasesLoading;

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
        <ScrollFade className="content-container h-full py-4">
          {gameIsError ? (
            <InlineError message="Unable to load this game." onRetry={() => refetchGame()} />
          ) : !game && !gameLoading ? (
            <p className="rounded-2xl bg-black/5 p-4 text-center text-sm text-text-secondary dark:bg-white/10">
              Game not found.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <section>
                <h1 className="mb-2 text-xl font-semibold">Game ready</h1>
                <p className="text-sm text-text-secondary">
                  {game?.status === "completed" ? "Completed game" : "Active game"}
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold text-text-secondary">Players</h2>
                {playersIsError ? (
                  <InlineError
                    message="Unable to load game players."
                    onRetry={() => refetchPlayers()}
                  />
                ) : (
                  <List
                    isLoading={isLoading}
                    shimmerRows={3}
                    emptyMessage="No players in this game"
                  >
                    {players?.map((player) => (
                      <span key={player.id}>{player.name}</span>
                    ))}
                  </List>
                )}
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold text-text-secondary">Phases</h2>
                {phasesIsError ? (
                  <InlineError
                    message="Unable to load game phases."
                    onRetry={() => refetchPhases()}
                  />
                ) : (
                  <List isLoading={isLoading} shimmerRows={4} emptyMessage="No phases in this game">
                    {phases?.map((phase, index) => (
                      <div key={phase.id} className="flex items-center gap-2">
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xs font-semibold text-text-secondary tabular-nums dark:border-white/20 dark:bg-white/10">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {formatPhaseDisplayName(phase)}
                        </span>
                      </div>
                    ))}
                  </List>
                )}
              </section>
            </div>
          )}
        </ScrollFade>
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
