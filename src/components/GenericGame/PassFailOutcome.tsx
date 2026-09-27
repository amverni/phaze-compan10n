import { Check, X } from "lucide-react";

export function PassFailOutcome({ passed }: { passed: boolean }) {
  const Icon = passed ? Check : X;
  return (
    <Icon
      aria-hidden
      className={[
        "inline-block size-5 shrink-0",
        passed ? "text-pt-green-500" : "text-pt-red-500",
      ].join(" ")}
    />
  );
}
