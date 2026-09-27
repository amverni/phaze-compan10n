import { createFileRoute } from "@tanstack/react-router";
import { PhaseGames } from "../../components/Games/PhaseGames";

export const Route = createFileRoute("/phaseCompan10n/games")({
  component: PhaseGames,
});
