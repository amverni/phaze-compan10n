import { Button } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Star, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { phasesApi } from "../../data/api/phases";
import { useToggleFavorite } from "../../data/hooks/useFavorites";
import { phaseKeys } from "../../data/hooks/usePhases";
import type { VisiblePhase } from "../../types";
import { formatPhaseRequirements } from "../../utils";
import { FavoriteAccent } from "../ui";

export interface PhaseListRowProps {
  phase: VisiblePhase;
  isFavorite: boolean;
  onView?: (phase: VisiblePhase) => void;
}

export function PhaseListRow({ phase, isFavorite: isFavoriteProp, onView }: PhaseListRowProps) {
  const queryClient = useQueryClient();
  const toggleFavorite = useToggleFavorite();
  const [isFavorite, setIsFavorite] = useState(isFavoriteProp);
  const isBuiltIn = phase.type === "built-in";

  const deletePhase = useMutation({
    mutationFn: (id: string) => phasesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: phaseKeys.all });
    },
  });

  useEffect(() => {
    setIsFavorite(isFavoriteProp);
  }, [isFavoriteProp]);

  function handleToggleFavorite() {
    const previous = isFavorite;
    setIsFavorite(!previous);
    toggleFavorite.mutate(
      { entityType: "phase", entityId: phase.id },
      { onError: () => setIsFavorite(previous) },
    );
  }

  return (
    <div className="group/row relative -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center text-sm [&:hover:not(:has(.trash-btn:hover,.favorite-btn:hover))]:bg-black/5 dark:[&:hover:not(:has(.trash-btn:hover,.favorite-btn:hover))]:bg-white/10">
      <FavoriteAccent active={isFavorite} />
      <Button
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 h-full text-left"
        onClick={() => onView?.(phase)}
      >
        <span className="flex-1 truncate">{formatPhaseRequirements(phase.requirements)}</span>
        {isBuiltIn ? (
          <Eye className="h-4 w-4 shrink-0 text-text-secondary group-hover/row:text-blue-500" />
        ) : (
          <Pencil className="h-4 w-4 shrink-0 fill-none text-text-secondary group-hover/row:fill-blue-500 group-hover/row:text-blue-500" />
        )}
      </Button>
      <Button
        className="favorite-btn mx-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:text-amber-400! hover:bg-black/5 dark:hover:bg-white/20"
        onClick={handleToggleFavorite}
      >
        <Star className={isFavorite ? "h-4 w-4 shrink-0 fill-current" : "h-4 w-4 shrink-0"} />
      </Button>
      {!isBuiltIn && (
        <Button
          className="group/trash trash-btn mx-1 flex size-8 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:text-red-500! hover:bg-black/5 dark:hover:bg-white/20"
          onClick={() => deletePhase.mutate(phase.id)}
        >
          <Trash className="h-4 w-4 shrink-0 fill-none group-hover/trash:fill-current" />
        </Button>
      )}
    </div>
  );
}
