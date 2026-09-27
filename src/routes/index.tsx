import { createFileRoute } from "@tanstack/react-router";
import { ScorekeeperHome } from "../components/ScorekeeperHome/ScorekeeperHome";

export const Route = createFileRoute("/")({
  component: ScorekeeperHome,
});
