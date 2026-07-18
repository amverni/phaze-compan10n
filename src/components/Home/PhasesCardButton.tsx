import { Link } from "@tanstack/react-router";
import type React from "react";
import { PhasesCardEntryButtonContent, phasesCardEntryButtonClasses } from "../PhasesCard";
import { Button } from "../ui";

export const PhasesCardButton: React.FC = () => {
  return (
    <Button
      as={Link}
      to="/phasescard"
      aria-label="Open Phases Card"
      className={phasesCardEntryButtonClasses}
    >
      <PhasesCardEntryButtonContent />
    </Button>
  );
};
