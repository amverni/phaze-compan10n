import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "../ui";

interface CreateButtonProps {
  to: "/scorekeeper/create" | "/phaseCompan10n/create";
}

export function CreateButton({ to }: CreateButtonProps) {
  return (
    <Button as={Link} to={to} aria-label="Create Game" className="page-shell-button">
      <Plus className="size-8 relative z-10" aria-hidden="true" />
    </Button>
  );
}
