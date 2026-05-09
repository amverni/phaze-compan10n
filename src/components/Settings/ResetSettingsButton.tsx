import { RotateCcw } from "lucide-react";
import { useResetSettings } from "../../data/hooks/useSettings";
import { Button } from "../ui";

interface ResetSettingsButtonProps {
  disabled: boolean;
}

export function ResetSettingsButton({ disabled }: ResetSettingsButtonProps) {
  const resetSettings = useResetSettings();

  return (
    <Button
      type="button"
      className="size-10 shrink-0"
      onClick={() => resetSettings.mutate()}
      disabled={disabled || resetSettings.isPending}
      aria-label="Reset settings to defaults"
      title="Reset settings to defaults"
    >
      <RotateCcw className="size-4" />
    </Button>
  );
}
