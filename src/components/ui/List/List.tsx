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
import { Button } from "@headlessui/react";
import { ChevronsUpDown, Minus } from "lucide-react";
import { Children, type ReactNode } from "react";
import "./List.css";

const ROW_HEIGHT = "h-10";

function ShimmerRow() {
  return (
    <div className={`${ROW_HEIGHT} flex items-center px-3`}>
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

function RowDivider() {
  return <div className="list-divider mx-3 border-t border-white/10 dark:border-white/5" />;
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      className="cursor-pointer rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
      onClick={onClick}
    >
      <Minus className="h-5 w-5 shrink-0 text-text-secondary" />
    </Button>
  );
}

function rowClassName(isFirst: boolean, isLast: boolean) {
  const radius =
    isFirst && isLast ? "rounded-2xl" : isFirst ? "rounded-t-2xl" : isLast ? "rounded-b-2xl" : "";
  return `${ROW_HEIGHT} ${radius} flex items-center px-3 text-sm`;
}

interface SortableRowProps {
  id: string;
  children: ReactNode;
  className: string;
  removable?: boolean;
  onRemove?: (id: string) => void;
}

function SortableRow({ id, children, className, removable, onRemove }: SortableRowProps) {
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
          className="touch-none cursor-grab rounded-full p-1 text-text-secondary hover:bg-black/5 active:cursor-grabbing dark:hover:bg-white/10"
          {...listeners}
        >
          <ChevronsUpDown className="h-5 w-5 shrink-0" />
        </Button>
      </div>
    </div>
  );
}

export interface SortableItem {
  id: string;
}

export interface ListProps {
  children?: ReactNode;
  isLoading?: boolean;
  shimmerRows?: number;
  emptyMessage?: ReactNode;
  sortable?: boolean;
  items?: SortableItem[];
  onReorder?: (items: SortableItem[]) => void;
  removable?: boolean;
  onRemove?: (id: string) => void;
}

export function List({
  children,
  isLoading = false,
  shimmerRows = 0,
  emptyMessage,
  sortable = false,
  items,
  onReorder,
  removable = false,
  onRemove,
}: ListProps) {
  const childArray = Children.toArray(children);
  const sortableCount = sortable && items ? items.length : 0;
  const sortableIds = items?.map((item) => item.id) ?? [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  if (!isLoading && childArray.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
        {emptyMessage}
      </div>
    );
  }

  const sortableChildren = childArray.slice(0, sortableCount);
  const staticChildren = childArray.slice(sortableCount);
  const totalCount = childArray.length;

  const renderSortableRows = () => (
    <>
      <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
        {sortableChildren.map((child, i) => {
          const isFirst = i === 0;
          const isLast = i === totalCount - 1;
          const itemId = sortableIds[i];
          return (
            <div key={itemId}>
              {i > 0 && <RowDivider />}
              <SortableRow
                id={itemId}
                className={rowClassName(isFirst, isLast)}
                removable={removable}
                onRemove={onRemove}
              >
                {child}
              </SortableRow>
            </div>
          );
        })}
      </SortableContext>
      {staticChildren.map((child, i) => {
        const globalIndex = sortableCount + i;
        const isFirst = globalIndex === 0;
        const isLast = globalIndex === totalCount - 1;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: trailing static children never reorder
          <div key={`static-${i}`}>
            {globalIndex > 0 && <RowDivider />}
            <div className={rowClassName(isFirst, isLast)}>{child}</div>
          </div>
        );
      })}
    </>
  );

  const renderPlainRows = () =>
    childArray.map((child, i) => {
      const isFirst = i === 0;
      const isLast = i === childArray.length - 1;
      return (
        // biome-ignore lint/suspicious/noArrayIndexKey: children carry their own keys
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
          {renderSortableRows()}
        </DndContext>
      ) : (
        renderPlainRows()
      )}
    </div>
  );
}
