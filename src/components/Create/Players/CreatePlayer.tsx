import { ArrowLeft } from "lucide-react";
import { Button } from "../../ui/Button/Button";

export interface CreatePlayerProps {
  /** Pre-filled player name (e.g. from the search box). */
  defaultName?: string;
  /** Called when the user navigates back to the previous view. */
  onBack: () => void;
}

/**
 * Reusable "New Player" form shell.
 *
 * Currently a placeholder — the full form (name, color, etc.) will be
 * implemented separately. Accepts a `defaultName` so callers can seed
 * the name field from context (e.g. search text).
 */
export function CreatePlayer({ defaultName, onBack }: CreatePlayerProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-0">
        <Button onClick={onBack} className="h-9 w-9 shrink-0 p-0" aria-label="Back to search">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-medium text-text-secondary">New Player</h2>
      </div>

      {/* Placeholder body */}
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-sm text-text-secondary">
          {defaultName ? `Create "${defaultName}"…` : "Create a new player…"}
        </p>
      </div>
    </div>
  );
}
