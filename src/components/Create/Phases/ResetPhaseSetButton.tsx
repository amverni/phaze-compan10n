import { RotateCcw } from "lucide-react";
import { Button } from "../../ui";
import { iconPhaseButtonClasses } from "./phaseButtonClasses";

interface ResetPhaseSetButtonProps {
  onClick: () => void;
}

export function ResetPhaseSetButton({ onClick }: ResetPhaseSetButtonProps) {
  return (
    <Button
      type="button"
      className={iconPhaseButtonClasses}
      onClick={onClick}
      aria-label="Reset to default phase set"
      title="Reset to default phase set"
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}
