import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CreateGameProvider } from "../components/Create/CreateGameContext";

export const Route = createFileRoute("/create")({
  component: () => (
    <CreateGameProvider>
      <Outlet />
    </CreateGameProvider>
  ),
});
