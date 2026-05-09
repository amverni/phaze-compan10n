import { Save as SaveIcon } from "lucide-react";
import { useState } from "react";
import { Button, Dialog } from "../../ui";
import { iconPhaseButtonClasses } from "./phaseButtonClasses";

interface SavePhaseSetButtonProps {
  disabled?: boolean;
}

export function SavePhaseSetButton({ disabled = false }: SavePhaseSetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className={iconPhaseButtonClasses}
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label="Save phase set"
        title="Save phase set"
      >
        <SaveIcon className="size-4" />
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-label="Save phase set">
        <div className="flex h-full flex-col px-4 pt-3 pb-4">
          <h2 className="text-lg font-semibold">Save phase set</h2>
          <p className="mt-2 text-sm text-text-secondary">Save phase set flow coming soon.</p>
        </div>
      </Dialog>
    </>
  );
}
