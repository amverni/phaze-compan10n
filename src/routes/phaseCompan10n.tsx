import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/phaseCompan10n")({
  head: () => ({ meta: [{ title: "Phaze Compan10n" }] }),
  component: Outlet,
});
