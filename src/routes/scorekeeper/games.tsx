import { createFileRoute } from "@tanstack/react-router";
import { GenericGames } from "../../components/Games/GenericGames";

export const Route = createFileRoute("/scorekeeper/games")({
  component: GenericGames,
});
