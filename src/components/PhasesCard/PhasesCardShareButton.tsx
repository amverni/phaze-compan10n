import { Check, Share } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PhasesCardShareTarget } from "../../types";
import { Button } from "../ui";
import { buildPhasesCardShareUrl } from "./phasesCardUrl";
import "./PhasesCardShareButton.css";

interface PhasesCardShareButtonProps {
  target: PhasesCardShareTarget;
  className?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}

const SUCCESS_MS = 5000;

export function PhasesCardShareButton({
  target,
  className,
  disabled = false,
  onError,
}: PhasesCardShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  async function handleShare() {
    try {
      const url = buildPhasesCardShareUrl(target);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), SUCCESS_MS);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Unable to copy Phases Card link.");
    }
  }

  return (
    <Button
      type="button"
      onClick={handleShare}
      disabled={disabled}
      aria-label={copied ? "Phases Card link copied" : "Share Phases Card"}
      className={[
        "phases-card-share relative h-12 w-16 overflow-hidden rounded-2xl border border-black/20 text-black",
        "hover:brightness-105 active:scale-95",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden className="phases-card-share__cap phases-card-share__cap--top" />
      <span aria-hidden className="phases-card-share__cap phases-card-share__cap--bottom" />
      {copied ? (
        <Check className="relative z-10 size-5 text-black" aria-hidden />
      ) : (
        <Share className="relative z-10 size-5 text-black" aria-hidden />
      )}
    </Button>
  );
}
