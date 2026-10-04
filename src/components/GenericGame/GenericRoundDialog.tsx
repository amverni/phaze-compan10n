import { DialogTitle } from "@headlessui/react";
import { Check, Loader2, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useAddGenericRound } from "../../data/hooks/useGenericGames";
import type { AddGenericRoundInput } from "../../types";
import { Button, Dialog, DialogScrollArea, InlineError } from "../ui";

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
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        {submitError && (
          <div className="flex max-h-1/3 min-h-0 shrink-0 flex-col pt-3">
            <DialogScrollArea aria-label="Round save error" className="wrap-anywhere">
              <InlineError message={submitError} />
            </DialogScrollArea>
          </div>
        )}
        <div className="shrink-0 pt-3">{actions}</div>
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

const roundActionClasses = [
  "size-11 shrink-0",
  "data-focus:outline-solid data-focus:outline-text-secondary!",
].join(" ");

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
        aria-label="Close"
        disabled={submitting}
        onClick={() => onClose(false)}
        className={roundActionClasses}
      >
        <X className="size-4" aria-hidden />
      </Button>
      {children}
      <Button
        type="submit"
        aria-label="Save"
        disabled={!canSave || submitting}
        className={roundActionClasses}
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <Check className="size-4" aria-hidden />
        )}
      </Button>
    </div>
  );
}
