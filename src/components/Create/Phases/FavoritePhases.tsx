import { useQuery } from "@tanstack/react-query";
import { phaseListOptions } from "../../../data/hooks/usePhases";
import { List } from "../../ui";
import { useAddPhase, useGamePhases } from "../CreateGameContext";
import { AddPhaseRow } from "./AddPhaseRow";

export function FavoritePhases() {
  const addPhase = useAddPhase();
  const gamePhases = useGamePhases();
  const gamePhaseIds = new Set(gamePhases.map((p) => p.id));
  const { data: favorites = [], isLoading } = useQuery(phaseListOptions({ isFavorite: 1 }));

  if (!favorites.length) return null;

  return (
    <section>
      <h2>Favorite Phases</h2>
      <List isLoading={isLoading} shimmerRows={2}>
        {favorites.map((phase) => (
          <AddPhaseRow
            key={phase.id}
            phase={phase}
            onSelect={addPhase}
            disabled={gamePhaseIds.has(phase.id)}
          />
        ))}
      </List>
    </section>
  );
}
