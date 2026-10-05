import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { gamePhasePlayersOptions } from "../../data/hooks/useGames";
import { builtInPhaseSetMatchOptions } from "../../data/hooks/usePhaseSets";
import { phasesByIdsOptions } from "../../data/hooks/usePhases";
import type { GameId, TemporaryPhaseSet } from "../../types";
import { Dialog, DialogScrollArea, InlineError, Toast, type ToastHandle } from "../ui";
import { PhasesCardList } from "./PhasesCardList";
import { PhasesCardShareButton } from "./PhasesCardShareButton";

interface PhasesCardDialogProps {
  gameId: GameId;
  open: boolean;
  onClose: (open: boolean) => void;
  phaseSet: TemporaryPhaseSet;
}

export function PhasesCardDialog({ gameId, open, onClose, phaseSet }: PhasesCardDialogProps) {
  const toastRef = useRef<ToastHandle>(null);
  const phasePlayersQuery = useQuery({
    ...gamePhasePlayersOptions(gameId),
    enabled: open,
  });
  const {
    data: phases = [],
    isError,
    isLoading,
    refetch,
  } = useQuery({
    ...phasesByIdsOptions([...phaseSet.phases]),
    enabled: open,
  });
  const missingPhaseRecords =
    open && !isLoading && !isError && phases.length !== phaseSet.phases.length;
  const canMatchBuiltIn =
    open && !isLoading && !isError && !missingPhaseRecords && phases.length > 0;
  const { data: builtInPhaseSetId = null, isLoading: builtInMatchLoading } = useQuery({
    ...builtInPhaseSetMatchOptions(phases),
    enabled: canMatchBuiltIn,
  });

  return (
    <Dialog open={open} onClose={onClose} aria-label="Phases Card">
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pt-2 pb-3 text-text-primary">
        <div className="flex shrink-0 justify-end">
          <PhasesCardShareButton
            target={{ source: "game-snapshot", name: phaseSet.name, phases, builtInPhaseSetId }}
            className="size-10!"
            disabled={
              isLoading ||
              builtInMatchLoading ||
              isError ||
              missingPhaseRecords ||
              phases.length === 0
            }
            onError={(message) => toastRef.current?.show(message)}
          />
        </div>
        {isError ? (
          <InlineError message="Unable to load phases." onRetry={() => refetch()} />
        ) : missingPhaseRecords ? (
          <InlineError message="This Phase Set is missing phase data and cannot be shared." />
        ) : phasePlayersQuery.isError ? (
          <InlineError
            message="Unable to load Players' Current Phases."
            onRetry={() => phasePlayersQuery.refetch()}
          />
        ) : (
          <DialogScrollArea
            aria-label="Phases Card phase list"
            aria-busy={isLoading || phasePlayersQuery.isPending}
          >
            <PhasesCardList
              phases={phases}
              playerGroups={phasePlayersQuery.data}
              isLoading={isLoading || phasePlayersQuery.isPending}
              scrollable={false}
            />
          </DialogScrollArea>
        )}
        <Toast ref={toastRef} />
      </div>
    </Dialog>
  );
}
