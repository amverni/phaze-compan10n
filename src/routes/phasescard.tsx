import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/phasescard")({
  component: () => <Outlet />,
});
