import { Flag } from "lucide-react";
import { useRef, useState } from "react";
import { ControlledPopover, InlineError, PlainButton } from "../ui";

interface FinishGameMenuProps {
  open: boolean;
  active: boolean;
  action: "finish" | "delete" | null;
  onOpenChange: (open: boolean) => void;
  onFinish: () => Promise<void>;
  onDelete: () => Promise<void>;
  onPause: () => void;
  afterClose: () => void;
}

const actionClasses = [
  "relative min-h-12 w-full cursor-pointer px-4 py-3 text-left text-sm font-medium",
  "hover:bg-text-primary/5 dark:hover:bg-text-primary/10",
  "focus-visible:-outline-offset-4",
].join(" ");

export function FinishGameMenu({
  open,
  active,
  action,
  onOpenChange,
  onFinish,
  onDelete,
  onPause,
  afterClose,
}: FinishGameMenuProps) {
  const resumeRef = useRef<HTMLButtonElement>(null);
  const actionStarted = useRef(false);
  const [pendingAction, setPendingAction] = useState<"finish" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isPending = pendingAction !== null;
  const displayedAction = pendingAction ?? action;

  async function performAction() {
    if (actionStarted.current || !active || !action) return;
    actionStarted.current = true;
    setPendingAction(action);
    setError(null);
    try {
      await (action === "delete" ? onDelete() : onFinish());
    } catch (cause) {
      setError(
        `Couldn't ${action} Game: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
    } finally {
      actionStarted.current = false;
      setPendingAction(null);
    }
  }

  if (!active && !open) return null;

  return (
    <ControlledPopover
      open={open}
      onOpenChange={(nextOpen) => {
        if (!actionStarted.current) {
          if (nextOpen) setError(null);
          onOpenChange(nextOpen);
        }
      }}
      dismissible={!isPending}
      label="Finish Game"
      initialFocus={resumeRef}
      restoreFocus={active}
      afterClose={afterClose}
      trigger={
        <PlainButton
          aria-label="Finish Game"
          disabled={isPending || !active}
          className={[
            "page-shell-footer-button group relative rounded-full p-0",
            "focus-visible:outline-offset-2",
          ].join(" ")}
        >
          <span className="glass absolute inset-0 inline-flex items-center justify-center rounded-full transition-transform group-hover:brightness-110 group-active:scale-110">
            <Flag className="relative size-8" aria-hidden />
          </span>
        </PlainButton>
      }
    >
      <div className="flex flex-col" aria-busy={isPending}>
        <PlainButton
          className={actionClasses}
          disabled={isPending}
          onClick={() => {
            if (!actionStarted.current) onPause();
          }}
        >
          Pause
        </PlainButton>
        <PlainButton
          ref={resumeRef}
          className={actionClasses}
          disabled={isPending}
          onClick={() => {
            if (!actionStarted.current) onOpenChange(false);
          }}
        >
          Resume
        </PlainButton>
        <PlainButton
          className={[actionClasses, displayedAction === "delete" ? "text-pt-red-500" : ""].join(
            " ",
          )}
          disabled={!active || !action || isPending}
          onClick={performAction}
        >
          {displayedAction === "delete"
            ? isPending
              ? "Deleting..."
              : "Delete"
            : isPending
              ? "Finishing..."
              : "Finish"}
        </PlainButton>
        {error && (
          <div className="px-3 pb-3">
            <InlineError message={error} />
          </div>
        )}
      </div>
    </ControlledPopover>
  );
}
