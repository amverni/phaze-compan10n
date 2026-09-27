import { createFileRoute } from "@tanstack/react-router";
import { GenericGame } from "../../components/GenericGame/GenericGame";

export const Route = createFileRoute("/game/$gameId")({
  component: GameRoute,
});

function GameRoute() {
  const { gameId } = Route.useParams();
  return <GenericGame key={gameId} gameId={gameId} />;
}
