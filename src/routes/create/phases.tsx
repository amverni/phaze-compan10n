import { createFileRoute } from "@tanstack/react-router";
import { Phases } from "../../components/Create/Phases/Phases";

export const Route = createFileRoute("/create/phases")({
  component: Phases,
});
