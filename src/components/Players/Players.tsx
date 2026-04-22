import { ArrowLeft, Plus } from "lucide-react";
import { useState } from "react";
import type { Player } from "../../types";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button, Dialog } from "../ui";
import { PlayerEditor } from "./PlayerEditor";
import { PlayerListRow } from "./PlayerListRow";
import { PlayersSearch } from "./PlayersSearch";

export function Players() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultName, setDefaultName] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<Player | undefined>();

  function handleClose() {
    setDialogOpen(false);
  }

  function handleAfterLeave() {
    setDefaultName("");
    setEditingPlayer(undefined);
  }

  function handleEdit(player: Player) {
    setEditingPlayer(player);
    setDialogOpen(true);
  }

  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center">
          <div className="absolute inset-0 flex items-center justify-center pt-6">
            <Logo height={100} width="100%" />
          </div>
        </div>
      }
      mainContent={
        <div className="content-container h-full">
          <PlayersSearch
            renderRow={(player) => <PlayerListRow player={player} onEdit={handleEdit} />}
            actions={(searchTerm) => (
              <Button
                onClick={() => {
                  setDefaultName(searchTerm);
                  setDialogOpen(true);
                }}
                className="h-9 w-9 shrink-0 p-0"
                aria-label="Create new player"
              >
                <Plus className="h-5 w-5" />
              </Button>
            )}
          />
          <Dialog open={dialogOpen} onClose={handleClose} afterLeave={handleAfterLeave}>
            <PlayerEditor
              defaultName={defaultName}
              player={editingPlayer}
              onBack={handleClose}
              onDeleted={handleClose}
            />
          </Dialog>
        </div>
      }
      footerContent={
        <div className="content-container flex h-full">
          <Button
            onClick={() => window.history.back()}
            className="size-14 p-0"
            aria-label="Go back"
          >
            <ArrowLeft className="size-8" />
          </Button>
        </div>
      }
    />
  );
}
