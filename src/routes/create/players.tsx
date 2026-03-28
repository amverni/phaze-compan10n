import { createFileRoute } from "@tanstack/react-router";
import { Players } from "../../components/Create/Players/Players";

export const Route = createFileRoute("/create/players")({
  component: Players,
  validateSearch: (search: Record<string, unknown>) => ({
    from: (search.from as string) || undefined,
  }),
});
