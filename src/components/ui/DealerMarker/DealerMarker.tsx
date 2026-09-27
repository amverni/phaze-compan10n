export function DealerMarker({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={[
        "inline-flex size-4.25 shrink-0 items-center justify-center rounded-full",
        "bg-dealer-background text-dealer-text text-xs font-medium leading-none",
        className,
      ].join(" ")}
    >
      D
    </span>
  );
}
