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

type ShareUrlResult =
  | { ok: true; url: string; targetKey: string }
  | { ok: false; message: string; targetKey: string };

function getShareUrlResult(target: PhasesCardShareTarget): ShareUrlResult {
  try {
    const url = buildPhasesCardShareUrl(target);
    return { ok: true, url, targetKey: url };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to copy Phases Card link.",
      targetKey: getTargetKey(target),
    };
  }
}

function getTargetKey(target: PhasesCardShareTarget): string {
  const baseTarget = {
    source: target.source,
    name: target.name.trim(),
    phases: target.phases,
  };
  if (target.source !== "phase-set") return JSON.stringify(baseTarget);
  return JSON.stringify({
    ...baseTarget,
    phaseSet: [target.phaseSet.type, target.phaseSet.id],
  });
}

export function PhasesCardShareButton({
  target,
  className,
  disabled = false,
  onError,
}: PhasesCardShareButtonProps) {
  const shareUrlResult = getShareUrlResult(target);
  const targetKey = shareUrlResult.targetKey;
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  const copied = shareUrlResult.ok && copiedUrl === shareUrlResult.url;

  useEffect(() => {
    setCopiedUrl((currentUrl) => (currentUrl === targetKey ? currentUrl : null));
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;

    return () => window.clearTimeout(timeoutRef.current);
  }, [targetKey]);

  async function handleShare() {
    if (!shareUrlResult.ok) {
      onError?.(shareUrlResult.message);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrlResult.url);
      setCopiedUrl(shareUrlResult.url);
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setCopiedUrl((currentUrl) => (currentUrl === shareUrlResult.url ? null : currentUrl));
      }, SUCCESS_MS);
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
        "phases-card-share relative h-12 w-16 overflow-hidden rounded-2xl! border border-black/20 text-text-primary dark:border-white/20",
        "hover:brightness-105! active:scale-95!",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden className="phases-card-share__cap phases-card-share__cap--top" />
      <span aria-hidden className="phases-card-share__cap phases-card-share__cap--bottom" />
      {copied ? (
        <Check className="relative z-10 size-5" aria-hidden />
      ) : (
        <Share className="relative z-10 size-5" aria-hidden />
      )}
    </Button>
  );
}
