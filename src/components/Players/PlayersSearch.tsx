import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Fragment,
  type ReactNode,
  type RefObject,
  useDeferredValue,
  useRef,
  useState,
} from "react";
import { playerListOptions } from "../../data/hooks/usePlayers";
import type { Player } from "../../types";
import { List, ScrollFade, SearchBar } from "../ui";

export interface PlayersSearchProps {
  /** Ref forwarded to the search input for focus management. */
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Render function for each player row in the results list. */
  renderRow: (player: Player) => ReactNode;
  /** Optional render function for extra action buttons. Receives the current search term. */
  actions?: (searchTerm: string) => ReactNode;
}

/**
 * Reusable player-search view with a search bar and a scrollable results list.
 * The caller controls what each row looks like via `renderRow` and can inject
 * extra action buttons (e.g. create-player) via `actions`.
 */
export function PlayersSearch({
  inputRef: externalInputRef,
  renderRow,
  actions,
}: PlayersSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;

  const deferredSearch = useDeferredValue(searchTerm);

  const { data: players, isLoading } = useQuery({
    ...playerListOptions(deferredSearch ? { name: deferredSearch } : undefined),
    placeholderData: keepPreviousData,
  });

  const emptyMessage = deferredSearch
    ? `No players matching "${deferredSearch}"`
    : "No players yet";

  return (
    <div className="h-full w-full shrink-0 flex flex-col">
      <SearchBar
        ref={inputRef}
        value={searchTerm}
        onValueChange={setSearchTerm}
        placeholder="Search players…"
        className="pt-3"
      >
        {actions?.(searchTerm)}
      </SearchBar>

      {/* Results - negative margin lets shadow bleed, inner padding restores layout */}
      <ScrollFade className="min-h-0 flex-1 -mx-6 px-6 pt-2 pb-[calc(0.5rem+var(--slant))]">
        <List isLoading={isLoading} shimmerRows={4} emptyMessage={emptyMessage}>
          {players?.map((player) => (
            <Fragment key={player.id}>{renderRow(player)}</Fragment>
          ))}
        </List>
      </ScrollFade>
    </div>
  );
}
