import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  importedPhasesCardMatchOptions,
  useSaveImportedPhasesCard,
} from "../../data/hooks/usePhasesCardImport";
import type { PhasesCardPhase } from "../../types";
import { Button, Toast, type ToastHandle } from "../ui";

interface PhasesCardSaveButtonProps {
  name: string;
  phases: PhasesCardPhase[];
}

const SAVE_SUCCESS_MS = 5000;

export function PhasesCardSaveButton({ name, phases }: PhasesCardSaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);
  const toastRef = useRef<ToastHandle>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const input = { name, phases };
  const {
    data: savedMatch,
    isError: savedMatchError,
    isFetching: savedMatchFetching,
    isLoading: savedMatchLoading,
    isSuccess: savedMatchSuccess,
    refetch: refetchSavedMatch,
  } = useQuery(importedPhasesCardMatchOptions(input));
  const saveImported = useSaveImportedPhasesCard();

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  if (hidden || (!saved && (savedMatchLoading || (savedMatchSuccess && savedMatch)))) return null;
  if (!saved && !savedMatchSuccess && !savedMatchError) return null;

  async function handleSave() {
    try {
      await saveImported.mutateAsync(input);
      setSaved(true);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setHidden(true), SAVE_SUCCESS_MS);
    } catch (error) {
      toastRef.current?.show(
        error instanceof Error ? error.message : "Unable to save Phases Card.",
      );
    }
  }

  return (
    <>
      {savedMatchError && !saved ? (
        <Button
          type="button"
          onClick={() => void refetchSavedMatch()}
          disabled={savedMatchFetching}
          aria-label="Retry checking whether this Phases Card is already saved"
          title="Unable to check whether this Phases Card is already saved"
          className="h-10 gap-2 rounded-full px-3 text-sm font-semibold text-red-700 dark:text-red-300"
        >
          {savedMatchFetching ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="size-4" aria-hidden />
          )}
          <span>{savedMatchFetching ? "Checking" : "Retry"}</span>
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveImported.isPending || saved}
          aria-label={saved ? "Phases Card saved" : "Save Phases Card"}
          className="h-10 gap-2 rounded-full px-3 text-sm font-semibold"
        >
          {saveImported.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : saved ? (
            <Check className="size-4 text-pt-green-500" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          <span>{saved ? "Saved" : "Save"}</span>
        </Button>
      )}
      <Toast ref={toastRef} />
    </>
  );
}
