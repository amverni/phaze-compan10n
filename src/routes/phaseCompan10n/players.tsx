import { createFileRoute } from "@tanstack/react-router";
import { Players } from "../../components/Players/Players";

export const Route = createFileRoute("/phaseCompan10n/players")({
  component: () => <Players experience="phaseCompan10n" />,
});
