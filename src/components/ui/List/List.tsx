import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus } from "lucide-react";
import { Children, type ReactNode, useLayoutEffect, useRef, useState } from "react";
import "./List.css";
import { Button } from "@headlessui/react";

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
  return <div className="list-divider mx-3 border-t border-white/10 dark:border-white/5" />;
}

/* ── Sortable row wrapper ──────────────────────────────────── */

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      className="cursor-pointer rounded-full p-1 transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10"
      onClick={onClick}
    >
      <Minus className="h-5 w-5 shrink-0 text-text-secondary" />
    </Button>
  );
}

function SortableRow({
  id,
  children,
  className,
  removable,
  onRemove,
}: {
  id: string;
  children: ReactNode;
  className: string;
  removable?: boolean;
  onRemove?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={className}>
        <div className="flex min-w-0 flex-1 items-center">{children}</div>
        {removable && onRemove && <RemoveButton onClick={() => onRemove(id)} />}
        <Button
          type="button"
          className="touch-none cursor-grab rounded-full p-1 text-text-secondary transition-colors duration-150 hover:bg-black/5 active:cursor-grabbing dark:hover:bg-white/10"
          {...listeners}
        >
          <GripVertical className="h-5 w-5 shrink-0" />
        </Button>
      </div>
    </div>
  );
}

/* ── Public API ────────────────────────────────────────────── */

export interface SortableItem {
  id: string;
}

export interface ListProps {
  /** Row elements to render inside the list. */
  children?: ReactNode;
  /** When true the shimmer loading UI is displayed instead of children. */
  isLoading?: boolean;
  /** Number of shimmer rows to show while loading (default: 3). */
  shimmerRows?: number;
  /** Content to render when the list is empty (not loading, no children). */
  emptyMessage?: ReactNode;
  /** Enable drag-and-drop reordering. Requires `items` and `onReorder`. */
  sortable?: boolean;
  /** Items corresponding 1:1 to children, providing the `id` for each sortable row. */
  items?: SortableItem[];
  /** Called after a drag-and-drop reorder with the new item order. */
  onReorder?: (items: SortableItem[]) => void;
  /** Animate newly added items with a slide-in effect. Requires `items`. */
  animateNewItems?: boolean;
  /** Show a remove button on each item row. Requires `items` and `onRemove`. */
  removable?: boolean;
  /** Called when a row's remove button is clicked. */
  onRemove?: (id: string) => void;
}

/**
 * A frosted-glass list container with a shimmer loading state.
 *
 * - **Loading** → shows `shimmerRows` placeholder rows.
 * - **Empty** → renders nothing.
 * - **Data** → renders each child separated by an inset divider.
 * - **Sortable** → opt-in drag-and-drop reordering via dnd-kit.
 */
export function List({
  children,
  isLoading = false,
  shimmerRows = 0,
  emptyMessage,
  sortable = false,
  items,
  onReorder,
  animateNewItems = false,
  removable = false,
  onRemove,
}: ListProps) {
  const childArray = Children.toArray(children);

  // Track newly added items for slide-in animation
  const prevItemIdsRef = useRef<Set<string> | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // useLayoutEffect runs after DOM mutation but before paint — no flash
  useLayoutEffect(() => {
    if (!animateNewItems || !items) return;

    const currentIds = new Set(items.map((item) => item.id));

    if (prevItemIdsRef.current !== null) {
      const prevIds = prevItemIdsRef.current;
      const newItem = items.find((item) => !prevIds.has(item.id));
      if (newItem && items.length > prevIds.size) {
        setAnimatingId(newItem.id);
      }
    }

    prevItemIdsRef.current = currentIds;
  }, [animateNewItems, items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!isLoading && childArray.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
        {emptyMessage}
      </div>
    );
  }

  function handleRemove(id: string) {
    setRemovingId(id);
  }

  function handleRemoveAnimationEnd() {
    if (removingId !== null && onRemove) {
      onRemove(removingId);
      setRemovingId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !items || !onReorder || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  }

  const rowClassName = (isFirst: boolean, isLast: boolean) => {
    const radius =
      isFirst && isLast ? "rounded-2xl" : isFirst ? "rounded-t-2xl" : isLast ? "rounded-b-2xl" : "";
    return `${ROW_HEIGHT} ${radius} flex items-center px-3 text-sm transition-colors duration-150`;
  };

  // Split children: sortable items use `items` length, rest are static (e.g. AddPlayerButton)
  const sortableCount = sortable && items ? items.length : 0;
  const sortableChildren = childArray.slice(0, sortableCount);
  const staticChildren = childArray.slice(sortableCount);
  const totalCount = childArray.length;

  const renderRows = () => (
    <>
      {sortable && items ? (
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {sortableChildren.map((child, i) => {
            const isFirst = i === 0;
            const isLast = i === totalCount - 1;
            const itemId = items[i].id;
            const isAnimating = animatingId === itemId;
            const isRemoving = removingId === itemId;
            const animClass = isRemoving ? "list-slide-out" : isAnimating ? "list-slide-in" : "";
            return (
              <div
                key={itemId}
                className={animClass}
                onAnimationEnd={
                  isRemoving
                    ? handleRemoveAnimationEnd
                    : isAnimating
                      ? () => setAnimatingId(null)
                      : undefined
                }
              >
                {i > 0 && <RowDivider />}
                <SortableRow
                  id={itemId}
                  className={rowClassName(isFirst, isLast)}
                  removable={removable}
                  onRemove={handleRemove}
                >
                  {child}
                </SortableRow>
              </div>
            );
          })}
        </SortableContext>
      ) : null}
      {staticChildren.map((child, i) => {
        const globalIndex = sortableCount + i;
        const isFirst = globalIndex === 0;
        const isLast = globalIndex === totalCount - 1;
        return (
          <div key={globalIndex}>
            {globalIndex > 0 && <RowDivider />}
            <div className={rowClassName(isFirst, isLast)}>{child}</div>
          </div>
        );
      })}
    </>
  );

  const nonSortableRows = () =>
    childArray.map((child, i) => {
      const isFirst = i === 0;
      const isLast = i === childArray.length - 1;
      return (
        /* biome-ignore lint/suspicious/noArrayIndexKey: children already have their own keys */
        <div key={i}>
          {i > 0 && <RowDivider />}
          <div className={rowClassName(isFirst, isLast)}>{child}</div>
        </div>
      );
    });

  return (
    <div className="glass relative overflow-hidden rounded-2xl">
      {isLoading ? (
        <ShimmerRows count={shimmerRows} />
      ) : sortable && items ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          {renderRows()}
        </DndContext>
      ) : (
        nonSortableRows()
      )}
    </div>
  );
}
