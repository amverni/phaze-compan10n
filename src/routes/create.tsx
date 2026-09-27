import { createFileRoute } from "@tanstack/react-router";
import { GenericCreateGame } from "../components/GenericCreate/GenericCreateGame";

export const Route = createFileRoute("/create")({
  component: GenericCreateGame,
});
