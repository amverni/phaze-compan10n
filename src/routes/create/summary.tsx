import { createFileRoute } from "@tanstack/react-router";
import { Summary } from "../../components/Create/Summary/Summary";

export const Route = createFileRoute("/create/summary")({
  component: Summary,
});
