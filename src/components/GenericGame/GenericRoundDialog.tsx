import { DialogTitle } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useAddGenericRound } from "../../data/hooks/useGenericGames";
import type { AddGenericRoundInput } from "../../types";
import { Button, Dialog, InlineError } from "../ui";

export function useGenericRoundDialog(onClose: (open: boolean) => void) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const addRound = useAddGenericRound();

  async function saveRound(input: AddGenericRoundInput, resetDraft: () => void) {
    await addRound.mutateAsync(input);
    resetDraft();
    onClose(false);
  }

  function clearSubmitError() {
    setSubmitError(null);
  }

  function handleSubmit(submit: () => Promise<void>) {
    clearSubmitError();
    submit().catch((error: unknown) => {
      setSubmitError(error instanceof Error ? error.message : "Unable to save Round.");
    });
  }

  return {
    isPending: addRound.isPending,
    submitError,
    clearSubmitError,
    saveRound,
    handleSubmit,
  };
}

interface GenericRoundDialogProps {
  open: boolean;
  onClose: (open: boolean) => void;
  isPending: boolean;
  onSubmit: () => void;
  submitError: string | null;
  children: ReactNode;
  actions: ReactNode;
}

export function GenericRoundDialog({
  open,
  onClose,
  isPending,
  onSubmit,
  submitError,
  children,
  actions,
}: GenericRoundDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} dismissible={!isPending}>
      <form
        className="flex h-full min-h-0 flex-col px-4 pt-1 pb-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogTitle className="sr-only">Add Round</DialogTitle>
        {children}
        <div className="shrink-0 pt-3">
          {submitError && <InlineError message={submitError} />}
          {actions}
        </div>
      </form>
    </Dialog>
  );
}

interface GenericRoundDialogActionsProps {
  onClose: (open: boolean) => void;
  submitting: boolean;
  canSave: boolean;
  children?: ReactNode;
}

export function GenericRoundDialogActions({
  onClose,
  submitting,
  canSave,
  children,
}: GenericRoundDialogActionsProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 pt-1 pb-2">
      <Button
        type="button"
        disabled={submitting}
        onClick={() => onClose(false)}
        className="min-h-11 px-4 text-sm data-focus:outline-text-secondary!"
      >
        Close
      </Button>
      {children}
      <Button
        type="submit"
        disabled={!canSave || submitting}
        className="min-h-11 gap-2 px-5 text-sm font-semibold data-focus:outline-text-secondary!"
      >
        {submitting && (
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        )}
        Save
      </Button>
    </div>
  );
}
