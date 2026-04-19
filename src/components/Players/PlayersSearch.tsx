import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { type ReactNode, type RefObject, useDeferredValue } from "react";
import { playerListOptions } from "../../../data/hooks/usePlayers";
import type { Player } from "../../../types";
import { Button, List } from "../../ui";

export interface PlayersSearchProps {
  /** Ref forwarded to the search input for focus management. */
  inputRef: RefObject<HTMLInputElement | null>;
  /** Current search term (controlled). */
  searchTerm: string;
  /** Called when the search term changes. */
  onSearchTermChange: (value: string) => void;
  /** Render function for each player row in the results list. */
  renderRow: (player: Player) => ReactNode;
  /** Optional extra action buttons rendered after the clear button. */
  actions?: ReactNode;
}

/**
 * Reusable player-search view with a search bar and a scrollable results list.
 * The caller controls what each row looks like via `renderRow` and can inject
 * extra action buttons (e.g. create-player) via `actions`.
 */
export function PlayersSearch({
  inputRef,
  searchTerm,
  onSearchTermChange,
  renderRow,
  actions,
}: PlayersSearchProps) {
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
      {/* Search bar row */}
      <div className="flex items-center gap-2 p-3 pb-0">
        <div className="glass relative flex h-9 min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full px-3">
          <Search className="h-5 w-5 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Search players…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-secondary"
          />
        </div>

        <Button
          onClick={() => onSearchTermChange("")}
          disabled={!searchTerm}
          className="h-9 w-9 shrink-0 p-0"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" />
        </Button>

        {actions}
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <List isLoading={isLoading} shimmerRows={4} emptyMessage={emptyMessage}>
          {players?.map((player) => renderRow(player))}
        </List>
      </div>
    </div>
  );
}
