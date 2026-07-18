import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type ReactNode, useRef } from "react";
import type { PhasesCardPhase, PhasesCardShareTarget } from "../../types";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { Button, InlineError, Toast, type ToastHandle } from "../ui";
import { PhasesCardList } from "./PhasesCardList";
import { PhasesCardShareButton } from "./PhasesCardShareButton";

interface PhasesCardPageProps {
  topContent: ReactNode;
  phases?: PhasesCardPhase[];
  isLoading?: boolean;
  errorMessage?: string;
  onErrorRetry?: () => void;
  shareTarget?: PhasesCardShareTarget;
  saveAction?: ReactNode;
}

export function PhasesCardPage({
  topContent,
  phases = [],
  isLoading = false,
  errorMessage,
  onErrorRetry,
  shareTarget,
  saveAction,
}: PhasesCardPageProps) {
  const toastRef = useRef<ToastHandle>(null);

  return (
    <CardBackground
      headerContent={
        <div className="relative flex h-full items-center">
          <div className="absolute inset-0 flex items-center justify-center pt-6">
            <Logo height={100} width="100%" />
          </div>
        </div>
      }
      mainContent={
        <div className="content-container flex h-full min-h-0 flex-col py-4 pb-[calc(0.5rem+var(--slant))]">
          <div className="mb-3 flex min-h-10 shrink-0 items-center justify-center gap-3">
            <div className="flex min-w-0 flex-1 justify-center">{topContent}</div>
            {saveAction}
          </div>
          {errorMessage ? (
            <InlineError message={errorMessage} onRetry={onErrorRetry} />
          ) : (
            <PhasesCardList phases={phases} isLoading={isLoading} />
          )}
          <Toast ref={toastRef} />
        </div>
      }
      footerContent={
        <div className="content-container flex h-full items-center justify-between">
          <Button as={Link} to="/" className="size-14 p-0" aria-label="Go home">
            <ArrowLeft className="size-8" />
          </Button>
          {shareTarget && !errorMessage && (
            <PhasesCardShareButton
              target={shareTarget}
              disabled={isLoading || phases.length === 0}
              onError={(message) => toastRef.current?.show(message)}
            />
          )}
        </div>
      }
    />
  );
}
