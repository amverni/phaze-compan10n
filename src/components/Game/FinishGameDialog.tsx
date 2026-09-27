import { Description, DialogTitle } from "@headlessui/react";
import { useId } from "react";
import { Button, Dialog, InlineError } from "../ui";

interface FinishGameDialogProps {
  open: boolean;
  canFinish: boolean;
  isPending: boolean;
  error: string | null;
  onFinish: () => void;
  onResume: () => void;
  onPause: () => void;
  afterLeave: () => void;
}

export function FinishGameDialog({
  open,
  canFinish,
  isPending,
  error,
  onFinish,
  onResume,
  onPause,
  afterLeave,
}: FinishGameDialogProps) {
  const explanationId = useId();
  return (
    <Dialog open={open} onClose={onResume} dismissible={!isPending} afterLeave={afterLeave}>
      <div className="flex flex-col gap-4 px-4 pt-2 pb-4 text-text-primary" aria-busy={isPending}>
        <DialogTitle className="text-lg font-semibold">Finish Game</DialogTitle>
        <Description className="text-sm text-text-secondary">
          Finish saves the current Standings as the final result. Resume keeps you here. Pause
          returns home so you can continue this Game later.
        </Description>
        {!canFinish && (
          <p id={explanationId} className="text-sm text-text-secondary">
            Save at least one Round before finishing.
          </p>
        )}
        {error && <InlineError message={error} />}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" className="px-4 py-3" disabled={isPending} onClick={onPause}>
            Pause
          </Button>
          <Button
            type="button"
            className="px-4 py-3"
            data-autofocus
            disabled={isPending}
            onClick={onResume}
          >
            Resume
          </Button>
          <Button
            type="button"
            className="px-4 py-3"
            disabled={!canFinish || isPending}
            aria-describedby={!canFinish ? explanationId : undefined}
            onClick={onFinish}
          >
            {isPending ? "Finishing..." : "Finish"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
