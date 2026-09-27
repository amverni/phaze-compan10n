import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CreateGameProvider } from "../../components/Create/CreateGameContext";

export const Route = createFileRoute("/phaseCompan10n/create")({
  component: () => (
    <CreateGameProvider>
      <Outlet />
    </CreateGameProvider>
  ),
});
