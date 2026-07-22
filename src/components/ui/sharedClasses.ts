/** Interactive classes shared by pressable UI elements. */
export const interactiveClasses = [
  "cursor-pointer",
  "focus:outline-none data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-white/60",
].join(" ");

/** Shared circular number badge used by Phases Card and Standings place display. */
export const numberCircleClasses = [
  "inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full",
  "border border-text-secondary/25 bg-text-secondary/10 text-xs font-semibold",
  "text-text-secondary tabular-nums",
].join(" ");
