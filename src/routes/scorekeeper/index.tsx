import { createFileRoute } from "@tanstack/react-router";
import { ScorekeeperHome } from "../../components/ScorekeeperHome/ScorekeeperHome";

export const Route = createFileRoute("/scorekeeper/")({
  component: ScorekeeperHome,
});
