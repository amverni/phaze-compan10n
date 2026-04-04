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
  /** Content to render when the list is empty (not loading, no children). */
  emptyMessage?: ReactNode;
}

/**
 * A frosted-glass list container with a shimmer loading state.
 *
 * - **Loading** → shows `shimmerRows` placeholder rows.
 * - **Empty** → renders nothing.
 * - **Data** → renders each child separated by an inset divider.
 */
export function List({ children, isLoading = false, shimmerRows = 0, emptyMessage }: ListProps) {
  const childArray = Children.toArray(children);

  if (!isLoading && childArray.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="glass relative overflow-hidden rounded-2xl">
      {isLoading ? (
        <ShimmerRows count={shimmerRows} />
      ) : (
        childArray.map((child, i) => {
          const isFirst = i === 0;
          const isLast = i === childArray.length - 1;
          const radius =
            isFirst && isLast
              ? "rounded-2xl"
              : isFirst
                ? "rounded-t-2xl"
                : isLast
                  ? "rounded-b-2xl"
                  : "";

          return (
            /* biome-ignore lint/suspicious/noArrayIndexKey: children already have their own keys */
            <div key={i}>
              {i > 0 && <RowDivider />}
              <div
                className={`${ROW_HEIGHT} ${radius} flex items-center px-3 text-sm transition-colors duration-150 hover:bg-white/10 focus-within:bg-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-white/50`}
              >
                {child}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
