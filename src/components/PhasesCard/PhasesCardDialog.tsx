import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { phasesByIdsOptions } from "../../data/hooks/usePhases";
import type { TemporaryPhaseSet } from "../../types";
import { Dialog, InlineError, Toast, type ToastHandle } from "../ui";
import { PhasesCardList } from "./PhasesCardList";
import { PhasesCardShareButton } from "./PhasesCardShareButton";

interface PhasesCardDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  phaseSet: TemporaryPhaseSet;
}

export function PhasesCardDialog({ open, onClose, phaseSet }: PhasesCardDialogProps) {
  const toastRef = useRef<ToastHandle>(null);
  const {
    data: phases = [],
    isError,
    isLoading,
    refetch,
  } = useQuery(phasesByIdsOptions([...phaseSet.phases]));
  const missingPhaseRecords = !isLoading && !isError && phases.length !== phaseSet.phases.length;

  return (
    <Dialog open={open} onClose={onClose} aria-label="Phases Card">
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-2 pb-3 text-text-primary">
        <div className="flex shrink-0 justify-end">
          <PhasesCardShareButton
            target={{ source: "game-snapshot", name: phaseSet.name, phases }}
            disabled={isLoading || isError || missingPhaseRecords || phases.length === 0}
            onError={(message) => toastRef.current?.show(message)}
          />
        </div>
        {isError ? (
          <InlineError message="Unable to load phases." onRetry={() => refetch()} />
        ) : missingPhaseRecords ? (
          <InlineError message="This Phase Set is missing phase data and cannot be shared." />
        ) : (
          <PhasesCardList phases={phases} isLoading={isLoading} className="flex-1" />
        )}
        <Toast ref={toastRef} />
      </div>
    </Dialog>
  );
}
