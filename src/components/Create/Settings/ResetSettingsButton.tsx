import { RotateCcw } from "lucide-react";
import { Button } from "../../ui";
import { useResetGameSettings } from "../CreateGameContext";

export function ResetSettingsButton() {
  const resetGameSettings = useResetGameSettings();

  return (
    <Button
      type="button"
      className="size-10 shrink-0"
      onClick={resetGameSettings}
      aria-label="Reset game settings to defaults"
      title="Reset game settings to defaults"
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}
