import { createHashHistory, createRouter } from "@tanstack/react-router";
import { createGameRoute } from "./createGame";
import { indexRoute } from "./index";
import { rootRoute } from "./root";

const routeTree = rootRoute.addChildren([indexRoute, createGameRoute]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
