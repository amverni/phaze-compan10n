import "./PhasesCardEntryButton.css";

export const phasesCardEntryButtonClasses = [
  "glass phases-card-entry-card relative inline-flex h-(--page-shell-control-size) min-w-[4.8em] shrink-0 items-center justify-center overflow-hidden rounded-[0.8em]!",
  // Include the fixed 1px glass border in the proportional horizontal inset.
  "px-[calc(0.9em-1px)]",
  "text-[length:calc(var(--page-shell-control-size)*5/28)] font-bold leading-none tracking-[-0.02em]",
  "hover:brightness-110 active:scale-95!",
].join(" ");

export function PhasesCardEntryButtonContent() {
  return (
    <>
      <span aria-hidden className="phases-card-entry-card__cap phases-card-entry-card__cap--top" />
      <span
        aria-hidden
        className="phases-card-entry-card__cap phases-card-entry-card__cap--bottom"
      />
      <span className="relative z-10">Phases</span>
    </>
  );
}
