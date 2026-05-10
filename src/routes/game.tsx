import { createFileRoute } from "@tanstack/react-router";
import { Game } from "../components/Game/Game";

export const Route = createFileRoute("/game")({
  validateSearch: (search: Record<string, unknown>): { gameId: string } => ({
    gameId: typeof search.gameId === "string" ? search.gameId : "",
  }),
  component: GameRoute,
});

function GameRoute() {
  const { gameId } = Route.useSearch();
  return <Game gameId={gameId} />;
}
