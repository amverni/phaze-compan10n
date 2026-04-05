import { Button } from "@headlessui/react";
import { useState } from "react";
import { AddPlayerDialog } from "./AddPlayerDialog";

/** Button that opens the add-player dialog. */
export function AddPlayerButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-2 opacity-50 outline-none transition-opacity duration-150 hover:opacity-80"
      >
        <span className="text-base leading-none">+</span>
        <span>Add Player</span>
      </Button>

      <AddPlayerDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
