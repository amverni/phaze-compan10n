import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { favoritesApi } from "../../data/api/favorites";
import { favoriteKeys } from "../../data/hooks/useFavorites";
import { ManagePhaseSetDialog } from "./ManagePhaseSetDialog";
import { PhaseSetListRow } from "./PhaseSetListRow";
import { PhaseSetSearch } from "./PhaseSetSearch";

export function PhaseSetsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPhaseSetId, setSelectedPhaseSetId] = useState<string | undefined>();

  const { data: favoriteIds } = useQuery({
    queryKey: favoriteKeys.byType("phaseSet"),
    queryFn: () => favoritesApi.getAll("phaseSet"),
  });

  const favoriteSet = new Set(favoriteIds ?? []);

  function handleView(phaseSetId: string) {
    setSelectedPhaseSetId(phaseSetId);
    setDialogOpen(true);
  }

  function handleClose() {
    setDialogOpen(false);
  }

  return (
    <>
      <PhaseSetSearch
        renderRow={(phaseSet) => (
          <PhaseSetListRow
            key={phaseSet.id}
            phaseSet={phaseSet}
            isFavorite={favoriteSet.has(phaseSet.id)}
            onView={handleView}
          />
        )}
      />
      <ManagePhaseSetDialog
        phaseSetId={selectedPhaseSetId}
        open={dialogOpen}
        onClose={handleClose}
        afterLeave={() => setSelectedPhaseSetId(undefined)}
      />
    </>
  );
}
