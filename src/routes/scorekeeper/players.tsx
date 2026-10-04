import { createFileRoute } from "@tanstack/react-router";
import { Players } from "../../components/Players/Players";

export const Route = createFileRoute("/scorekeeper/players")({
  component: () => <Players experience="scorekeeper" />,
});
