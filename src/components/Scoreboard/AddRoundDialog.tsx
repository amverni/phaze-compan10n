import type { Player } from "../../types";
import { Dialog } from "../ui/Dialog/Dialog";
import { AddRoundForm } from "./AddRoundForm";

interface AddRoundDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  gameId: string;
  players: Player[];
}

export function AddRoundDialog({ open, onClose, gameId, players }: AddRoundDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <AddRoundForm
        gameId={gameId}
        players={players}
        onSubmitted={() => onClose(false)}
        onCancel={() => onClose(false)}
      />
    </Dialog>
  );
}
