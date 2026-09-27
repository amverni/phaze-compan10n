import { createFileRoute } from "@tanstack/react-router";
import { Scorekeepers } from "../components/Scorekeepers/Scorekeepers";

export const Route = createFileRoute("/scorekeepers")({
  component: Scorekeepers,
});
