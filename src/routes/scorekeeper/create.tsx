import { createFileRoute } from "@tanstack/react-router";
import { GenericCreateGame } from "../../components/GenericCreate/GenericCreateGame";

export const Route = createFileRoute("/scorekeeper/create")({
  component: GenericCreateGame,
});
