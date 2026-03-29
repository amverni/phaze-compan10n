import { Children, type ReactNode } from "react";
import "./List.css";

/** Height of a single row — keeps loading and loaded states identical. */
const ROW_HEIGHT = "h-10";

/* ── Sub-components ────────────────────────────────────────── */

function ShimmerRow() {
  return (
    <div className={`${ROW_HEIGHT} flex items-center px-3`}>
      {/* text-shaped shimmer bar */}
      <div className="list-shimmer h-4 w-full rounded-md" />
    </div>
  );
}

function ShimmerRows({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        /* biome-ignore lint/suspicious/noArrayIndexKey: static shimmer placeholders never reorder */
        <ShimmerRow key={i} />
      ))}
    </>
  );
}

/* ── Divider between rows ──────────────────────────────────── */

function RowDivider() {
  return <div className="mx-3 border-t border-white/10 dark:border-white/5" />;
}

/* ── Public API ────────────────────────────────────────────── */

export interface ListProps {
  /** Row elements to render inside the list. */
  children?: ReactNode;
  /** When true the shimmer loading UI is displayed instead of children. */
  isLoading?: boolean;
  /** Number of shimmer rows to show while loading (default: 3). */
  shimmerRows?: number;
}

/**
 * A frosted-glass list container with a shimmer loading state.
 *
 * - **Loading** → shows `shimmerRows` placeholder rows.
 * - **Empty** → renders nothing.
 * - **Data** → renders each child separated by an inset divider.
 */
export function List({ children, isLoading = false, shimmerRows = 0 }: ListProps) {
  const childArray = Children.toArray(children);

  if (!isLoading && childArray.length === 0) return null;

  return (
    <div className="glass relative overflow-hidden rounded-2xl">
      {isLoading ? (
        <ShimmerRows count={shimmerRows} />
      ) : (
        childArray.map((child, i) => (
          /* biome-ignore lint/suspicious/noArrayIndexKey: children already have their own keys */
          <div key={i}>
            {i > 0 && <RowDivider />}
            <div
              className={`${ROW_HEIGHT} flex items-center px-3 text-sm transition-colors duration-150 hover:bg-white/10`}
            >
              {child}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
