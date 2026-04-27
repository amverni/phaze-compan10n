import { ArrowLeft } from "lucide-react";
import type { VisiblePhase } from "../../types";
import { formatPhaseRequirements } from "../../utils";
import { Button, Dialog } from "../ui";

export interface ManagePhaseDialogProps {
  phase?: VisiblePhase;
  open: boolean;
  onClose: () => void;
  afterLeave?: () => void;
}

export function ManagePhaseDialog({ phase, open, onClose, afterLeave }: ManagePhaseDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} afterLeave={afterLeave}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Button onClick={onClose} className="size-9 shrink-0 p-0" aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
          <h2 className="flex-1 truncate text-lg font-semibold">{phase?.name ?? "Phase"}</h2>
        </div>

        {phase && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-secondary">Requirements</p>
            <p className="text-sm">{formatPhaseRequirements(phase.requirements)}</p>

            <p className="mt-2 text-sm text-text-secondary">Type</p>
            <p className="text-sm capitalize">{phase.type}</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
