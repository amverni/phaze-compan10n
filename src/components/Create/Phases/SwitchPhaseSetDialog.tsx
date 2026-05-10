import { Button } from "@headlessui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { phaseSetsApi } from "../../../data/api/phaseSets";
import { phaseSetListOptions } from "../../../data/hooks/usePhaseSets";
import type { Phase, PhaseSetId } from "../../../types";
import { Dialog, InlineError, List, SearchBar } from "../../ui";

export interface SwitchPhaseSetDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectPhases: (phases: Phase[]) => void;
}

export function SwitchPhaseSetDialog({ open, onClose, onSelectPhases }: SwitchPhaseSetDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectError, setSelectError] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(searchTerm);

  const {
    data: phaseSets = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...phaseSetListOptions(deferredSearch ? { name: deferredSearch } : undefined),
    placeholderData: keepPreviousData,
  });

  async function handleSelect(id: PhaseSetId) {
    try {
      setSelectError(null);
      const phases = await phaseSetsApi.getPhases(id);
      if (phases.length === 0) {
        setSelectError("This phase set has no phases.");
        return;
      }
      onSelectPhases(phases);
      onClose();
    } catch (error) {
      setSelectError(error instanceof Error ? error.message : "Unable to load this phase set");
    }
  }

  const emptyMessage = deferredSearch
    ? `No phase sets matching "${deferredSearch}"`
    : "No phase sets yet";

  return (
    <Dialog open={open} onClose={onClose} aria-label="Switch phase set">
      <div className="flex h-full flex-col px-4 pb-4">
        <SearchBar
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder="Search phase sets…"
          className="pt-3"
        />

        {/* Phase set list */}
        <div className="min-h-0 flex-1 overflow-y-auto -mx-4 px-4 py-2">
          {selectError && <InlineError message={selectError} />}
          {isError ? (
            <InlineError message="Unable to load phase sets." onRetry={() => refetch()} />
          ) : (
            <List isLoading={isLoading} shimmerRows={4} emptyMessage={emptyMessage}>
              {phaseSets.map((ps) => (
                <Button
                  key={ps.id}
                  className="-mx-3 flex h-full w-[calc(100%+1.5rem)] cursor-pointer items-center justify-between px-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => handleSelect(ps.id)}
                >
                  <span className="truncate">{ps.name}</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-text-secondary" />
                </Button>
              ))}
            </List>
          )}
        </div>
      </div>
    </Dialog>
  );
}
