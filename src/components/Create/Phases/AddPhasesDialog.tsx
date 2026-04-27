import { Button } from "@headlessui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { phaseSetListOptions } from "../../../data/hooks/usePhaseSets";
import { phaseListOptions } from "../../../data/hooks/usePhases";
import type { MeldType, PhaseSetId } from "../../../types";
import { formatPhaseRequirements } from "../../../utils";
import {
  Dialog,
  List,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  SearchBar,
} from "../../ui";
import { useAddPhase, useGamePhases } from "../CreateGameContext";

export interface AddPhasesDialogProps {
  open: boolean;
  onClose: () => void;
}

const MELD_TYPE_OPTIONS: { label: string; value: MeldType }[] = [
  { label: "Set", value: "set" },
  { label: "Run", value: "run" },
  { label: "Color Group", value: "colorGroup" },
];

const ALL_MELD_TYPE_VALUES: MeldType[] = MELD_TYPE_OPTIONS.map((m) => m.value);

export function AddPhasesDialog({ open, onClose }: AddPhasesDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [meldType, setMeldType] = useState<MeldType[]>(ALL_MELD_TYPE_VALUES);
  const [phaseSetId, setPhaseSetId] = useState<PhaseSetId | null>(null);
  const deferredSearch = useDeferredValue(searchTerm);
  const addPhase = useAddPhase();
  const gamePhases = useGamePhases();
  const gamePhaseIds = new Set(gamePhases.map((p) => p.id));

  const setMeldTypes = (types: MeldType[]) => {
    setMeldType(types.length === 0 ? ALL_MELD_TYPE_VALUES : types);
  };

  const isAllTypes = meldType.length === ALL_MELD_TYPE_VALUES.length;

  const filters = {
    ...(deferredSearch ? { name: deferredSearch } : {}),
    ...(!isAllTypes ? { meldTypes: meldType } : {}),
    ...(phaseSetId ? { phaseSetId } : {}),
  };

  const { data: phases = [], isLoading } = useQuery({
    ...phaseListOptions(Object.keys(filters).length > 0 ? filters : undefined),
    placeholderData: keepPreviousData,
  });

  const { data: allPhaseSets = [] } = useQuery({
    ...phaseSetListOptions(),
    placeholderData: keepPreviousData,
  });

  const emptyMessage = deferredSearch ? `No phases matching "${deferredSearch}"` : "No phases yet";
  const meldTypeLabel = isAllTypes
    ? "All"
    : MELD_TYPE_OPTIONS.filter((m) => meldType.includes(m.value))
        .map((m) => m.label)
        .join(", ");
  const phaseSetLabel = allPhaseSets.find((ps) => ps.id === phaseSetId)?.name ?? "All sets";

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex h-full flex-col px-4 pb-4">
        <SearchBar
          value={searchTerm}
          onValueChange={setSearchTerm}
          placeholder="Search phases…"
          className="pt-3"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 py-2">
          <Listbox value={meldType} onChange={setMeldTypes} multiple>
            <ListboxButton>
              <span className="text-text-secondary">Type:</span> {meldTypeLabel}
            </ListboxButton>
            <ListboxOptions>
              {MELD_TYPE_OPTIONS.map(({ label, value }) => (
                <ListboxOption key={value} value={value} selected={meldType.includes(value)}>
                  {label}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>

          {allPhaseSets.length > 0 && (
            <Listbox value={phaseSetId} onChange={setPhaseSetId}>
              <ListboxButton>
                <span className="text-text-secondary">Set:</span> {phaseSetLabel}
              </ListboxButton>
              <ListboxOptions>
                <ListboxOption value={null}>All sets</ListboxOption>
                {allPhaseSets.map((ps) => (
                  <ListboxOption key={ps.id} value={ps.id}>
                    {ps.name}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Listbox>
          )}
        </div>

        {/* Phase list */}
        <div className="min-h-0 flex-1 overflow-y-auto -mx-4 px-4 py-2">
          <List isLoading={isLoading} shimmerRows={4} emptyMessage={emptyMessage}>
            {phases.map((phase) => (
              <Button
                key={phase.id}
                className="-mx-3 flex h-full w-[calc(100%+1.5rem)] cursor-pointer items-center justify-between px-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => addPhase(phase)}
                disabled={gamePhaseIds.has(phase.id)}
              >
                <span className="truncate">{formatPhaseRequirements(phase.requirements)}</span>
                <Plus className="h-5 w-5 shrink-0 text-text-secondary" />
              </Button>
            ))}
          </List>
        </div>
      </div>
    </Dialog>
  );
}
