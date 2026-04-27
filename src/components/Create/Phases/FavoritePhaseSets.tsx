import { Button } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronsRight } from "lucide-react";
import { phaseSetsApi } from "../../../data/api/phaseSets";
import { phasesApi } from "../../../data/api/phases";
import { phaseSetListOptions } from "../../../data/hooks/usePhaseSets";
import type { Phase, PhaseSetId } from "../../../types";
import { List } from "../../ui";

export interface FavoritePhaseSetsProps {
  onSelectPhases: (phases: Phase[]) => void;
}

export function FavoritePhaseSets({ onSelectPhases }: FavoritePhaseSetsProps) {
  const { data: favorites = [], isLoading } = useQuery(phaseSetListOptions({ isFavorite: 1 }));

  async function handleSelect(id: PhaseSetId) {
    try {
      const phaseSet = await phaseSetsApi.getById(id);
      if (!phaseSet) return;
      const phases = await phasesApi.getByIds([...phaseSet.phases]);
      onSelectPhases(phases);
    } catch {
      // Silently fail — the UI remains unchanged
    }
  }

  if (!favorites.length) return null;

  return (
    <section>
      <h2>Favorite Phase Sets</h2>
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
    </section>
  );
}
