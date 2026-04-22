import { Plus } from "lucide-react";
import { useRef, useState } from "react";
import { PlayerEditor } from "../../Players/PlayerEditor";
import { PlayersSearch } from "../../Players/PlayersSearch";
import { Button, Dialog } from "../../ui";
import { useAddPlayer, useGamePlayers } from "../CreateGameContext";
import { AddPlayerRow } from "./AddPlayerRow";
import "./AddPlayerDialog.css";

type View = "search" | "create";

export interface AddPlayerDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Dialog for searching and creating players. */
export function AddPlayerDialog({ open, onClose }: AddPlayerDialogProps) {
  const [defaultName, setDefaultName] = useState("");
  const [view, setView] = useState<View>("search");
  const inputRef = useRef<HTMLInputElement>(null);
  const addPlayer = useAddPlayer();
  const gamePlayers = useGamePlayers();
  const gamePlayerIds = new Set(gamePlayers.map((p) => p.id));

  function handleClose() {
    onClose();
  }

  function handleAfterLeave() {
    setDefaultName("");
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
        <div className="h-full w-full shrink-0 px-4">
          <PlayersSearch
            inputRef={inputRef}
            renderRow={(player) => (
              <AddPlayerRow
                player={player}
                onSelect={addPlayer}
                disabled={gamePlayerIds.has(player.id)}
              />
            )}
            actions={(searchTerm) => (
              <Button
                onClick={() => {
                  setDefaultName(searchTerm);
                  setView("create");
                }}
                className="h-9 w-9 shrink-0 p-0"
                aria-label="Create new player"
              >
                <Plus className="h-5 w-5" />
              </Button>
            )}
          />
        </div>

        {/* ── Page 2: Create Player ────────────────────── */}
        <div className="h-full w-full shrink-0">
          {view === "create" && (
            <PlayerEditor defaultName={defaultName} onBack={handleBack} onCreated={addPlayer} />
          )}
        </div>
      </div>
    </Dialog>
  );
}
