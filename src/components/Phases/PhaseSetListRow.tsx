import { Button } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Star, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { phaseSetsApi } from "../../data/api/phaseSets";
import { useToggleFavorite } from "../../data/hooks/useFavorites";
import { phaseSetKeys } from "../../data/hooks/usePhaseSets";
import type { BuiltInT, SavedT } from "../../types";
import { FavoriteAccent } from "../ui";

export interface PhaseSetListRowProps {
  phaseSet: { id: string; name: string; type: BuiltInT | SavedT };
  isFavorite: boolean;
  onView?: (phaseSetId: string) => void;
}

export function PhaseSetListRow({
  phaseSet,
  isFavorite: isFavoriteProp,
  onView,
}: PhaseSetListRowProps) {
  const queryClient = useQueryClient();
  const toggleFavorite = useToggleFavorite();
  const [isFavorite, setIsFavorite] = useState(isFavoriteProp);
  const isBuiltIn = phaseSet.type === "built-in";

  const deletePhaseSet = useMutation({
    mutationFn: (id: string) => phaseSetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: phaseSetKeys.all });
    },
  });

  useEffect(() => {
    setIsFavorite(isFavoriteProp);
  }, [isFavoriteProp]);

  function handleToggleFavorite() {
    const previous = isFavorite;
    setIsFavorite(!previous);
    toggleFavorite.mutate(
      { entityType: "phaseSet", entityId: phaseSet.id },
      { onError: () => setIsFavorite(previous) },
    );
  }

  return (
    <div className="group/row relative -mx-3 flex h-full w-[calc(100%+1.5rem)] items-center text-sm [&:hover:not(:has(.trash-btn:hover,.favorite-btn:hover))]:bg-black/5 dark:[&:hover:not(:has(.trash-btn:hover,.favorite-btn:hover))]:bg-white/10">
      <FavoriteAccent active={isFavorite} />
      <Button
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 h-full text-left"
        onClick={() => onView?.(phaseSet.id)}
      >
        <span className="flex-1 truncate">{phaseSet.name}</span>
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
          onClick={() => deletePhaseSet.mutate(phaseSet.id)}
        >
          <Trash className="h-4 w-4 shrink-0 fill-none group-hover/trash:fill-current" />
        </Button>
      )}
    </div>
  );
}
