import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useDeferredValue, useRef, useState } from "react";
import { playerListOptions } from "../../../data/hooks/usePlayers";
import { Button } from "../../ui/Button/Button";
import { Dialog } from "../../ui/Dialog/Dialog";
import { List } from "../../ui/List/List";
import { PlayerRow } from "./PlayerRow";

/** Button that opens a modal for adding a player. */
export function AddPlayerModal() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: players, isLoading } = useQuery(
    playerListOptions(deferredSearch ? { name: deferredSearch } : undefined),
  );

  function handleClose() {
    setOpen(false);
    setSearchTerm("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-2 opacity-50 transition-opacity duration-150 hover:opacity-80"
      >
        <span className="text-base leading-none">+</span>
        <span>Add Player</span>
      </button>

      <Dialog open={open} onClose={handleClose} initialFocus={inputRef}>
        {/* Search bar row */}
        <div className="flex items-center gap-2 p-3 pb-0">
          <div className="glass relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-full px-3 py-2">
            <Search className="h-4 w-4 shrink-0 opacity-40" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search players…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
            />
          </div>

          <Button
            onClick={() => setSearchTerm("")}
            className="h-9 w-9 shrink-0 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Results */}
        <div className="min-h-[40vh] max-h-[50vh] overflow-y-auto px-2 py-2">
          <List isLoading={isLoading} shimmerRows={4}>
            {players?.map((player) => (
              <PlayerRow key={player.id} player={player} />
            ))}
          </List>
        </div>
      </Dialog>
    </>
  );
}
