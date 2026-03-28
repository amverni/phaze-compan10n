import { createFileRoute } from "@tanstack/react-router";
import { Players } from "../../components/Create/Players/Players";

export const Route = createFileRoute("/create/players")({
  component: Players,
});
