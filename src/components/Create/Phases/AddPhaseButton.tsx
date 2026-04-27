import { Button } from "@headlessui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddPhasesDialog } from "./AddPhasesDialog";

export function AddPhaseButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="-mx-3 flex h-full w-[calc(100%+1.5rem)] cursor-pointer items-center gap-2 px-3 opacity-50 outline-none transition-all duration-150 hover:bg-black/5 hover:opacity-80 dark:hover:bg-white/10"
      >
        <Plus size={16} />
        <span>Add Phase</span>
      </Button>
      <AddPhasesDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
