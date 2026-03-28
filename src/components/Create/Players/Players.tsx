import { useSearch } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { CardBackground } from "../../CardBackground/CardBackground";
import { Button } from "../../ui/Button/Button";

export function Players() {
  const { from } = useSearch({ from: "/create/players" });
  const isEditing = from === "summary";

  return (
    <CardBackground
      headerContent={
        <div className="flex h-full items-center justify-between px-4">
          <h1 className="text-3xl font-semibold">Players</h1>

          <div className="flex items-center gap-2">
            {/* Placeholder for summary UI element */}
            <div />

            {/* Info icon (modal not yet implemented) */}
            <Button aria-label="Tips" size="small" icon={Info} />
          </div>
        </div>
      }
      footerContent={
        <div className="flex h-full items-center justify-between px-6">
          {/* Back button */}
          <Button aria-label="Back" onClick={() => window.history.back()} icon={ChevronLeft} />

          {/* Next button */}
          {!isEditing && (
            <Button as="link" to="/create/phases" aria-label="Next" icon={ChevronRight} />
          )}
        </div>
      }
    />
  );
}
