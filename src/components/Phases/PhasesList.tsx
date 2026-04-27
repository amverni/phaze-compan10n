import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { favoritesApi } from "../../data/api/favorites";
import { favoriteKeys } from "../../data/hooks/useFavorites";
import type { VisiblePhase } from "../../types";
import { ManagePhaseDialog } from "./ManagePhaseDialog";
import { PhaseListRow } from "./PhaseListRow";
import { PhasesSearch } from "./PhasesSearch";

export function PhasesList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<VisiblePhase | undefined>();

  const { data: favoriteIds } = useQuery({
    queryKey: favoriteKeys.byType("phase"),
    queryFn: () => favoritesApi.getAll("phase"),
  });

  const favoriteSet = new Set(favoriteIds ?? []);

  function handleView(phase: VisiblePhase) {
    setSelectedPhase(phase);
    setDialogOpen(true);
  }

  function handleClose() {
    setDialogOpen(false);
  }

  return (
    <>
      <PhasesSearch
        renderRow={(phase) => (
          <PhaseListRow
            key={phase.id}
            phase={phase}
            isFavorite={favoriteSet.has(phase.id)}
            onView={handleView}
          />
        )}
      />
      <ManagePhaseDialog
        phase={selectedPhase}
        open={dialogOpen}
        onClose={handleClose}
        afterLeave={() => setSelectedPhase(undefined)}
      />
    </>
  );
}
