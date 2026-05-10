import { Button } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronsRight } from "lucide-react";
import { useState } from "react";
import { phaseSetsApi } from "../../../data/api/phaseSets";
import { phaseSetListOptions } from "../../../data/hooks/usePhaseSets";
import type { Phase, PhaseSetId } from "../../../types";
import { InlineError, List } from "../../ui";

export interface FavoritePhaseSetsProps {
  onSelectPhases: (phases: Phase[]) => void;
}

export function FavoritePhaseSets({ onSelectPhases }: FavoritePhaseSetsProps) {
  const {
    data: favorites = [],
    isLoading,
    isError,
    refetch,
  } = useQuery(phaseSetListOptions({ isFavorite: 1 }));
  const [selectError, setSelectError] = useState<string | null>(null);

  async function handleSelect(id: PhaseSetId) {
    try {
      setSelectError(null);
      const phases = await phaseSetsApi.getPhases(id);
      if (phases.length === 0) {
        setSelectError("This phase set has no phases.");
        return;
      }
      onSelectPhases(phases);
    } catch (error) {
      setSelectError(error instanceof Error ? error.message : "Unable to load this phase set");
    }
  }

  if (!favorites.length && !isLoading && !isError && !selectError) return null;

  return (
    <section>
      <h2>Favorite Phase Sets</h2>
      {selectError && <InlineError message={selectError} />}
      {isError ? (
        <InlineError message="Unable to load favorite phase sets." onRetry={() => refetch()} />
      ) : (
        <List isLoading={isLoading} shimmerRows={2}>
          {favorites.map((phaseSet) => (
            <Button
              key={phaseSet.id}
              className="-mx-3 flex h-full w-[calc(100%+1.5rem)] cursor-pointer items-center justify-between px-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => handleSelect(phaseSet.id)}
            >
              <span className="truncate">{phaseSet.name}</span>
              <ChevronsRight className="h-5 w-5 shrink-0 text-text-secondary" />
            </Button>
          ))}
        </List>
      )}
    </section>
  );
}
