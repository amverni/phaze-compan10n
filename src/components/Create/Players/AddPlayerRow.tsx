import { useState } from "react";
import { Modal } from "../../ui/Modal/Modal";

/** Button row that opens a modal for adding a player. */
export function AddPlayerRow() {
  const [open, setOpen] = useState(false);

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

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold">Add Player</h2>
        <p className="mt-2 text-sm opacity-70">Player form coming soon…</p>
      </Modal>
    </>
  );
}
