import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Dialog } from "../../ui";
import { useAddPlayer, useGamePlayers } from "../CreateGameContext";
import { AddPlayerRow } from "./AddPlayerRow";
import { CreatePlayer } from "./CreatePlayer";
import { PlayersSearch } from "./PlayersSearch";
import "./AddPlayerDialog.css";

type View = "search" | "create";

export interface AddPlayerDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Dialog for searching and creating players. */
export function AddPlayerDialog({ open, onClose }: AddPlayerDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<View>("search");
  const inputRef = useRef<HTMLInputElement>(null);
  const addPlayer = useAddPlayer();
  const gamePlayers = useGamePlayers();
  const gamePlayerIds = new Set(gamePlayers.map((p) => p.id));

  function handleClose() {
    onClose();
  }

  function handleAfterLeave() {
    setSearchTerm("");
    setView("search");
  }

  function handleBack() {
    setView("search");
    // Re-focus the search input after sliding back
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      afterLeave={handleAfterLeave}
      initialFocus={inputRef}
      className="overflow-hidden"
    >
      <div className="add-player-slider h-full" data-view={view}>
        {/* ── Page 1: Search ───────────────────────────── */}
        <PlayersSearch
          inputRef={inputRef}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          renderRow={(player) => (
            <AddPlayerRow
              player={player}
              onSelect={addPlayer}
              disabled={gamePlayerIds.has(player.id)}
            />
          )}
          actions={
            <Button
              onClick={() => setView("create")}
              className="h-9 w-9 shrink-0 p-0"
              aria-label="Create new player"
            >
              <Plus className="h-5 w-5" />
            </Button>
          }
        />

        {/* ── Page 2: Create Player ────────────────────── */}
        <div className="h-full w-full shrink-0">
          {view === "create" && <CreatePlayer defaultName={searchTerm} onBack={handleBack} />}
        </div>
      </div>
    </Dialog>
  );
}
