import { Shuffle } from "lucide-react";
import { Button } from "../../ui";
import { iconPhaseButtonClasses } from "./phaseButtonClasses";

interface ShufflePhasesButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function ShufflePhasesButton({ disabled, onClick }: ShufflePhasesButtonProps) {
  return (
    <Button
      type="button"
      className={iconPhaseButtonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label="Shuffle phase order"
      title="Shuffle phase order"
    >
      <Shuffle className="size-4" />
    </Button>
  );
}
