import { createRoute } from "@tanstack/react-router";
import { Home } from "../components/Home/Home";
import { rootRoute } from "./root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});
