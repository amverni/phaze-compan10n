import { createFileRoute } from "@tanstack/react-router";
import { Phases } from "../components/Phases/Phases";

export const Route = createFileRoute("/phases")({
  component: Phases,
});
