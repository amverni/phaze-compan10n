import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({ meta: [{ title: "Scorekeeper" }] }),
  component: () => (
    <>
      <HeadContent />
      <Outlet />
    </>
  ),
});
