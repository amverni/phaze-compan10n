import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ReactNode, type RefObject, useDeferredValue, useRef, useState } from "react";
import { phaseSetListOptions } from "../../data/hooks/usePhaseSets";
import { phaseListOptions } from "../../data/hooks/usePhases";
import type { MeldType, VisiblePhase } from "../../types";
import {
  List,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  ScrollFade,
  SearchBar,
} from "../ui";

export interface PhasesSearchProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  renderRow: (phase: VisiblePhase) => ReactNode;
  actions?: (searchTerm: string) => ReactNode;
}

const MELD_TYPES: { label: string; value: MeldType }[] = [
  { label: "Set", value: "set" },
  { label: "Run", value: "run" },
  { label: "Color Group", value: "colorGroup" },
];

const ALL_MELD_TYPE_VALUES: MeldType[] = MELD_TYPES.map((m) => m.value);

export function PhasesSearch({
  inputRef: externalInputRef,
  renderRow,
  actions,
}: PhasesSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [meldTypeFilter, setMeldTypeFilter] = useState<MeldType[]>(ALL_MELD_TYPE_VALUES);
  const [phaseSetFilter, setPhaseSetFilter] = useState<string | null>(null);

  const setMeldTypes = (types: MeldType[]) => {
    setMeldTypeFilter(types.length === 0 ? ALL_MELD_TYPE_VALUES : types);
  };
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const deferredSearch = useDeferredValue(searchTerm);

  const isAllTypes = meldTypeFilter.length === ALL_MELD_TYPE_VALUES.length;

  const filters = {
    ...(deferredSearch ? { name: deferredSearch } : {}),
    ...(!isAllTypes ? { meldTypes: meldTypeFilter } : {}),
    ...(phaseSetFilter ? { phaseSetId: phaseSetFilter } : {}),
  };

  const { data: phases, isLoading } = useQuery({
    ...phaseListOptions(Object.keys(filters).length > 0 ? filters : undefined),
    placeholderData: keepPreviousData,
  });

  const { data: phaseSets } = useQuery(phaseSetListOptions());

  const emptyMessage = deferredSearch ? `No phases matching "${deferredSearch}"` : "No phases yet";

  const meldTypeLabel = isAllTypes
    ? "All"
    : MELD_TYPES.filter((m) => meldTypeFilter.includes(m.value))
        .map((m) => m.label)
        .join(", ");
  const phaseSetLabel = phaseSets?.find((ps) => ps.id === phaseSetFilter)?.name ?? "All sets";

  return (
    <div className="h-full w-full shrink-0 flex flex-col">
      <SearchBar
        ref={inputRef}
        value={searchTerm}
        onValueChange={setSearchTerm}
        placeholder="Search phases…"
        className="pt-3"
      >
        {actions?.(searchTerm)}
      </SearchBar>

      {/* Filters row */}
      <div className="flex items-center gap-2 pt-2 flex-wrap">
        <Listbox value={meldTypeFilter} onChange={setMeldTypes} multiple>
          <ListboxButton>
            <span className="text-text-secondary">Type:</span> {meldTypeLabel}
          </ListboxButton>
          <ListboxOptions>
            {MELD_TYPES.map(({ label, value }) => (
              <ListboxOption key={value} value={value} selected={meldTypeFilter.includes(value)}>
                {label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>

        {phaseSets && phaseSets.length > 0 && (
          <Listbox value={phaseSetFilter} onChange={setPhaseSetFilter}>
            <ListboxButton>
              <span className="text-text-secondary">Set:</span> {phaseSetLabel}
            </ListboxButton>
            <ListboxOptions>
              <ListboxOption value={null}>All sets</ListboxOption>
              {phaseSets.map((ps) => (
                <ListboxOption key={ps.id} value={ps.id}>
                  {ps.name}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Listbox>
        )}
      </div>

      <ScrollFade className="min-h-0 flex-1 -mx-6 px-6 pt-2 pb-[calc(0.5rem+var(--slant))]">
        <List isLoading={isLoading} shimmerRows={4} emptyMessage={emptyMessage}>
          {phases?.map((phase) => renderRow(phase))}
        </List>
      </ScrollFade>
    </div>
  );
}
