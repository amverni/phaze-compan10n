import { ArrowRightLeft } from "lucide-react";
import { Button } from "../../ui";
import { phaseButtonClasses } from "./phaseButtonClasses";

interface PhaseSetButtonProps {
  onClick: () => void;
}

export function PhaseSetButton({ onClick }: PhaseSetButtonProps) {
  return (
    <Button
      type="button"
      className={phaseButtonClasses}
      onClick={onClick}
      aria-label="Switch phase set"
      title="Phase Set"
    >
      <ArrowRightLeft className="size-4" />
      <span>Phase Set</span>
    </Button>
  );
}
