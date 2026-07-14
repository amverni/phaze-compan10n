import { Link } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import type React from "react";
import { Button } from "../ui";

export const PhasesCardButton: React.FC = () => {
  return (
    <Button as={Link} to="/phasescard" aria-label="Open Phases Card" className="size-10">
      <ListChecks className="relative z-10 size-6" />
    </Button>
  );
};
