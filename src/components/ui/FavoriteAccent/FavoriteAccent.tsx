export interface FavoriteAccentProps {
  active: boolean;
  className?: string;
}

const baseClasses = [
  "pointer-events-none absolute left-0 top-2 bottom-2 w-1",
  "origin-center transform-gpu rounded-r-full bg-amber-400",
  "transition-transform duration-400 ease-in-out",
].join(" ");

export function FavoriteAccent({ active, className }: FavoriteAccentProps) {
  const mergedClasses = [baseClasses, active ? "scale-y-100" : "scale-y-0", className]
    .filter(Boolean)
    .join(" ");

  return <span aria-hidden="true" className={mergedClasses} />;
}
