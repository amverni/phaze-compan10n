import { Shuffle } from "lucide-react";
import { Button } from "../../ui";
import { iconPhaseButtonClasses } from "../Phases/phaseButtonClasses";

interface ShufflePlayersButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function ShufflePlayersButton({ disabled, onClick }: ShufflePlayersButtonProps) {
  return (
    <Button
      type="button"
      className={iconPhaseButtonClasses}
      onClick={onClick}
      disabled={disabled}
      aria-label="Shuffle player order"
      title="Shuffle player order"
    >
      <Shuffle className="size-4" />
    </Button>
  );
}
