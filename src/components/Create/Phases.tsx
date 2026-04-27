import { useState } from "react";
import type { Phase } from "../../types";
import { FavoritePhaseSets } from "./Phases/FavoritePhaseSets";
import { FavoritePhases } from "./Phases/FavoritePhases";
import { GamePhases } from "./Phases/GamePhases";

export function Phases() {
  const [externalReplacementPhases, setExternalReplacementPhases] = useState<Phase[] | null>(null);

  return (
    <div className="flex flex-col gap-6 py-4">
      <GamePhases
        externalReplacementPhases={externalReplacementPhases}
        onExternalReplacementHandled={() => setExternalReplacementPhases(null)}
      />
      <FavoritePhaseSets onSelectPhases={setExternalReplacementPhases} />
      <FavoritePhases />
    </div>
  );
}
