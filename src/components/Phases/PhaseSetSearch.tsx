import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ReactNode, type RefObject, useDeferredValue, useRef, useState } from "react";
import { phaseSetListOptions } from "../../data/hooks/usePhaseSets";
import type { BuiltInT, SavedT } from "../../types";
import { List, ScrollFade, SearchBar } from "../ui";

export interface PhaseSetSearchProps {
  inputRef?: RefObject<HTMLInputElement | null>;
  renderRow: (phaseSet: { id: string; name: string; type: BuiltInT | SavedT }) => ReactNode;
  actions?: (searchTerm: string) => ReactNode;
}

export function PhaseSetSearch({
  inputRef: externalInputRef,
  renderRow,
  actions,
}: PhaseSetSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const deferredSearch = useDeferredValue(searchTerm);

  const { data: phaseSets, isLoading } = useQuery({
    ...phaseSetListOptions(deferredSearch ? { name: deferredSearch } : undefined),
    placeholderData: keepPreviousData,
  });

  const emptyMessage = deferredSearch
    ? `No phase sets matching "${deferredSearch}"`
    : "No phase sets yet";

  return (
    <div className="h-full w-full shrink-0 flex flex-col">
      <SearchBar
        ref={inputRef}
        value={searchTerm}
        onValueChange={setSearchTerm}
        placeholder="Search phase sets…"
        className="pt-3"
      >
        {actions?.(searchTerm)}
      </SearchBar>
      <ScrollFade className="min-h-0 flex-1 -mx-6 px-6 pt-2 pb-[calc(0.5rem+var(--slant))]">
        <List isLoading={isLoading} shimmerRows={4} emptyMessage={emptyMessage}>
          {phaseSets?.map((phaseSet) => renderRow(phaseSet))}
        </List>
      </ScrollFade>
    </div>
  );
}
