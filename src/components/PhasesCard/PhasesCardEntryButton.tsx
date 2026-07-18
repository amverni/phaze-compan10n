import "./PhasesCardEntryButton.css";

export const phasesCardEntryButtonClasses = [
  "glass phases-card-entry-card relative inline-flex h-14 min-w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg! px-2",
  "text-[0.625rem] font-bold leading-none tracking-[-0.02em]",
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
