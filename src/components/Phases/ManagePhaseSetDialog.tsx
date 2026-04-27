import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { phaseSetDetailOptions } from "../../data/hooks/usePhaseSets";
import { phasesByIdsOptions } from "../../data/hooks/usePhases";
import { formatPhaseRequirements } from "../../utils";
import { Button, Dialog, List } from "../ui";

export interface ManagePhaseSetDialogProps {
  phaseSetId?: string;
  open: boolean;
  onClose: () => void;
  afterLeave?: () => void;
}

export function ManagePhaseSetDialog({
  phaseSetId,
  open,
  onClose,
  afterLeave,
}: ManagePhaseSetDialogProps) {
  const { data: phaseSet } = useQuery({
    ...phaseSetDetailOptions(phaseSetId ?? ""),
    enabled: !!phaseSetId,
  });

  const { data: phases, isLoading: phasesLoading } = useQuery({
    ...phasesByIdsOptions(phaseSet?.phases ?? []),
    enabled: !!phaseSet && phaseSet.phases.length > 0,
  });

  return (
    <Dialog open={open} onClose={onClose} afterLeave={afterLeave}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Button onClick={onClose} className="size-9 shrink-0 p-0" aria-label="Go back">
            <ArrowLeft className="size-5" />
          </Button>
          <h2 className="flex-1 truncate text-lg font-semibold">{phaseSet?.name ?? "Phase Set"}</h2>
        </div>

        {phaseSet && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-secondary">Type</p>
            <p className="text-sm capitalize">{phaseSet.type}</p>

            <p className="mt-2 text-sm text-text-secondary">Phases ({phaseSet.phases.length})</p>
            <List isLoading={phasesLoading} shimmerRows={3} emptyMessage="No phases in this set">
              {phases?.map((phase, index) => (
                <div key={phase.id} className="flex items-center gap-2 text-sm">
                  <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-black/10 bg-black/5 text-xs font-semibold text-text-secondary tabular-nums dark:border-white/20 dark:bg-white/10">
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate">
                    {"name" in phase ? phase.name : formatPhaseRequirements(phase.requirements)}
                  </span>
                  <span className="shrink-0 text-xs text-text-secondary">
                    {formatPhaseRequirements(phase.requirements)}
                  </span>
                </div>
              ))}
            </List>
          </div>
        )}
      </div>
    </Dialog>
  );
}
