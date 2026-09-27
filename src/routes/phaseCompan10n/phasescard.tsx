import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/phaseCompan10n/phasescard")({
  component: () => <Outlet />,
});
