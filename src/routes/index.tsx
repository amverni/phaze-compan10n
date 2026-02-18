import { createRoute } from "@tanstack/react-router";
import { Home } from "../components/home";
import { rootRoute } from "./root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});
