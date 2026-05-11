import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Game } from "../../components/Game/Game";
import { gameDetailOptions } from "../../data/hooks/useGames";

export const Route = createFileRoute("/game/$gameId")({
  component: GameRoute,
});

function GameRoute() {
  const { gameId } = Route.useParams();
  const { data: game, isPending } = useQuery(gameDetailOptions(gameId));

  if (isPending) return null;
  if (!game) return <Navigate to="/" replace />;

  return <Game gameId={gameId} />;
}
