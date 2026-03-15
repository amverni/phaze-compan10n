import { createRoute } from "@tanstack/react-router";
import { Create } from "../components/Create/Create";
import { rootRoute } from "./root";

export const createGameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: Create,
});
