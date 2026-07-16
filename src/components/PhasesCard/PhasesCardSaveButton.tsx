import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, RotateCcw, Save } from "lucide-react";
import {
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
  const saveButtonRef = useRef<HTMLButtonElement | null>(null);
  const savedStatusRef = useRef<HTMLOutputElement>(null);
  const shouldFocusSavedStatusRef = useRef(false);
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

  useLayoutEffect(() => {
    if (!hidden || !shouldFocusSavedStatusRef.current) return;
    shouldFocusSavedStatusRef.current = false;
    savedStatusRef.current?.focus({ preventScroll: true });
  }, [hidden]);

  if (!saved && (savedMatchLoading || (savedMatchSuccess && savedMatch !== null))) {
    return null;
  }
  if (!saved && !savedMatchSuccess && !savedMatchError) return null;
  const saveButtonUnavailable = saveImported.isPending || saved;

  async function handleSave(event: ReactMouseEvent<HTMLButtonElement>) {
    if (saveButtonUnavailable) return;
    saveButtonRef.current = event.currentTarget;
    try {
      await saveImported.mutateAsync(input);
      setSaved(true);
      setHidden(false);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        shouldFocusSavedStatusRef.current = document.activeElement === saveButtonRef.current;
        setHidden(true);
      }, SAVE_SUCCESS_MS);
    } catch (error) {
      toastRef.current?.show(
        error instanceof Error ? error.message : "Unable to save Phases Card.",
      );
    }
  }

  return (
    <>
      {hidden && saved ? (
        <output
          ref={savedStatusRef}
          tabIndex={-1}
          className={[
            "glass relative inline-flex h-10 items-center justify-center gap-2 rounded-full",
            "px-3 text-sm font-semibold text-text-secondary",
            "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
          ].join(" ")}
        >
          <Check className="size-4 text-pt-green-500" aria-hidden />
          <span>Saved</span>
        </output>
      ) : savedMatchError && !saved ? (
        <div
          className={[
            "glass relative flex max-w-full items-center gap-2 rounded-2xl px-3 py-2",
            "text-sm text-red-700 dark:text-red-300",
          ].join(" ")}
          role="alert"
        >
          <span className="min-w-0 flex-1">
            Unable to check whether this Phases Card is already saved.
          </span>
          <Button
            type="button"
            onClick={() => void refetchSavedMatch()}
            disabled={savedMatchFetching}
            aria-label="Retry checking whether this Phases Card is already saved"
            className="h-9 shrink-0 gap-1.5 rounded-full px-3 text-sm font-semibold"
          >
            {savedMatchFetching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RotateCcw className="size-4" aria-hidden />
            )}
            <span>{savedMatchFetching ? "Checking" : "Retry"}</span>
          </Button>
        </div>
      ) : (
        <span>
          <Button
            type="button"
            onClick={handleSave}
            aria-disabled={saveButtonUnavailable}
            aria-label={saved ? "Phases Card saved" : "Save Phases Card"}
            className={[
              "h-10 gap-2 rounded-full px-3 text-sm font-semibold",
              saveButtonUnavailable && "pointer-events-none cursor-not-allowed opacity-40",
            ]
              .filter(Boolean)
              .join(" ")}
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
        </span>
      )}
      <Toast ref={toastRef} />
    </>
  );
}
