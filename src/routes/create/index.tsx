import { createFileRoute } from "@tanstack/react-router";
import { CreateGame } from "../../components/Create/CreateGame";

export const Route = createFileRoute("/create/")({
  component: CreateGame,
});
