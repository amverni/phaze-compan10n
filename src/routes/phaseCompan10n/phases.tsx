import { createFileRoute } from "@tanstack/react-router";
import { Phases } from "../../components/Phases/Phases";

export const Route = createFileRoute("/phaseCompan10n/phases")({
  component: Phases,
});
