import { createFileRoute } from "@tanstack/react-router";
import { Game } from "../../../components/Game/Game";

export const Route = createFileRoute("/phaseCompan10n/game/$gameId")({
  component: GameRoute,
});

function GameRoute() {
  const { gameId } = Route.useParams();
  return <Game key={gameId} gameId={gameId} />;
}
