import { useRef, useState } from "react";
import { Dialog } from "../../ui/Dialog/Dialog";
import { CreatePlayer } from "./CreatePlayer";
import { SearchPlayer } from "./SearchPlayer";
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

  function handleClose() {
    onClose();
    setSearchTerm("");
    setView("search");
  }

  function handleBack() {
    setView("search");
    // Re-focus the search input after sliding back
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <Dialog open={open} onClose={handleClose} initialFocus={inputRef} className="overflow-hidden">
      <div className="add-player-slider h-full" data-view={view}>
        {/* ── Page 1: Search ───────────────────────────── */}
        <SearchPlayer
          inputRef={inputRef}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onCreatePlayer={() => setView("create")}
        />

        {/* ── Page 2: Create Player ────────────────────── */}
        <div className="h-full w-full shrink-0">
          <CreatePlayer defaultName={searchTerm} onBack={handleBack} />
        </div>
      </div>
    </Dialog>
  );
}
