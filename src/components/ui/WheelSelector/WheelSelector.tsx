import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { type KeyboardEvent, type PointerEvent, useCallback, useRef, useState } from "react";
import "./WheelSelector.css";

export interface WheelSelectorProps {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step: number;
  values?: number[];
  label: string;
  disabled?: boolean;
  className?: string;
}

const ITEM_HEIGHT = 32;
const MAX_RESISTANCE = 20;
const VISIBLE_OFFSETS = [-2, -1, 0, 1, 2] as const;

interface DragState {
  active: boolean;
  pointerId: number | null;
  startY: number;
  startValue: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampToStep(value: number, min: number, max: number, step: number) {
  const stepped = min + Math.round((value - min) / step) * step;
  return clamp(stepped, min, max);
}

function rubberBand(delta: number, stepsToMin: number, stepsToMax: number) {
  const maxDownDelta = stepsToMax * ITEM_HEIGHT;
  const maxUpDelta = -stepsToMin * ITEM_HEIGHT;

  if (delta > maxDownDelta) {
    return maxDownDelta + Math.min(MAX_RESISTANCE, (delta - maxDownDelta) * 0.25);
  }

  if (delta < maxUpDelta) {
    return maxUpDelta - Math.min(MAX_RESISTANCE, (maxUpDelta - delta) * 0.25);
  }

  return delta;
}

function valueForOffset(value: number, offset: number, step: number) {
  return value - offset * step;
}

function normalizeValues(values: number[] | undefined, min: number, max: number) {
  if (!values || values.length === 0) {
    return null;
  }

  const uniqueValues = Array.from(new Set(values)).filter((candidate) => {
    return candidate >= min && candidate <= max;
  });
  uniqueValues.sort((a, b) => a - b);
  return uniqueValues.length > 0 ? uniqueValues : null;
}

function nearestValue(value: number, values: number[]) {
  return values.reduce((nearest, candidate) => {
    const nearestDistance = Math.abs(value - nearest);
    const candidateDistance = Math.abs(value - candidate);
    if (candidateDistance !== nearestDistance) {
      return candidateDistance < nearestDistance ? candidate : nearest;
    }

    return candidate < nearest ? candidate : nearest;
  }, values[0]);
}

function indexForValue(value: number, values: number[]) {
  return values.indexOf(nearestValue(value, values));
}

export function WheelSelector({
  value,
  onChange,
  min,
  max,
  step,
  values,
  label,
  disabled = false,
  className,
}: WheelSelectorProps): React.JSX.Element {
  const safeStep = Math.max(Math.abs(step), 1);
  const allowedValues = normalizeValues(values, min, max);
  const effectiveMin = allowedValues?.[0] ?? min;
  const effectiveMax = allowedValues?.[allowedValues.length - 1] ?? max;
  const [dragOffset, setDragOffset] = useState(0);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const touchCleanup = useRef<(() => void) | null>(null);
  const drag = useRef<DragState>({
    active: false,
    pointerId: null,
    startY: 0,
    startValue: value,
  });

  const safeValue = allowedValues ? nearestValue(value, allowedValues) : value;
  const displayValue = dragValue ?? safeValue;

  const commitValue = useCallback(
    (next: number) => {
      const clamped = allowedValues
        ? nearestValue(next, allowedValues)
        : clampToStep(next, min, max, safeStep);
      setDragValue(clamped);
      if (clamped !== value) {
        onChange(clamped);
      }
      return clamped;
    },
    [allowedValues, max, min, onChange, safeStep, value],
  );

  const updateDrag = useCallback(
    (clientY: number) => {
      const d = drag.current;
      if (!d.active) return;

      const startIndex = allowedValues ? indexForValue(d.startValue, allowedValues) : null;
      const stepsToMin = allowedValues ? (startIndex ?? 0) : (d.startValue - min) / safeStep;
      const stepsToMax = allowedValues
        ? allowedValues.length - 1 - (startIndex ?? 0)
        : (max - d.startValue) / safeStep;
      const resistedDelta = rubberBand(clientY - d.startY, stepsToMin, stepsToMax);
      const movedSteps = Math.round(resistedDelta / ITEM_HEIGHT);
      const next = allowedValues
        ? allowedValues[clamp((startIndex ?? 0) + movedSteps, 0, allowedValues.length - 1)]
        : d.startValue + movedSteps * safeStep;
      const committed = commitValue(next);
      const actualSteps = allowedValues
        ? indexForValue(committed, allowedValues) - (startIndex ?? 0)
        : (committed - d.startValue) / safeStep;
      setDragOffset(resistedDelta - actualSteps * ITEM_HEIGHT);
    },
    [allowedValues, commitValue, max, min, safeStep],
  );

  const startDrag = useCallback(
    (clientY: number, pointerId: number | null = null) => {
      if (disabled) return;
      drag.current = {
        active: true,
        pointerId,
        startY: clientY,
        startValue: safeValue,
      };
      setDragValue(safeValue);
      setDragOffset(0);
    },
    [disabled, safeValue],
  );

  const finishDrag = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    drag.current.pointerId = null;
    setDragValue(null);
    setDragOffset(0);
  }, []);

  const nudgeBy = (amount: number) => {
    if (disabled) return;
    const next = allowedValues
      ? allowedValues[
          clamp(
            indexForValue(value, allowedValues) +
              Math.sign(amount) * Math.max(1, Math.round(Math.abs(amount) / safeStep)),
            0,
            allowedValues.length - 1,
          )
        ]
      : clampToStep(value + amount, min, max, safeStep);
    if (next !== value) {
      onChange(next);
    }
  };

  const setExact = (next: number) => {
    if (disabled) return;
    const clamped = allowedValues ? nearestValue(next, allowedValues) : clamp(next, min, max);
    if (clamped !== value) {
      onChange(clamped);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target || disabled) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();
      nudgeBy(safeStep);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      nudgeBy(-safeStep);
      return;
    }

    if (event.key === "PageUp") {
      event.preventDefault();
      nudgeBy(safeStep * 5);
      return;
    }

    if (event.key === "PageDown") {
      event.preventDefault();
      nudgeBy(-safeStep * 5);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setExact(min);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setExact(max);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    startDrag(event.clientY, event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || !drag.current.active || drag.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    updateDrag(event.clientY);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  };

  const wheelCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      touchCleanup.current?.();
      touchCleanup.current = null;
      if (!node) return;

      const onTouchStart = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (!touch || disabled) return;
        event.stopPropagation();
        startDrag(touch.clientY);
      };

      const onTouchMove = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (!touch || !drag.current.active) return;
        event.preventDefault();
        event.stopPropagation();
        updateDrag(touch.clientY);
      };

      const onTouchEnd = (event: TouchEvent) => {
        event.stopPropagation();
        finishDrag();
      };

      node.addEventListener("touchstart", onTouchStart, { passive: false });
      node.addEventListener("touchmove", onTouchMove, { passive: false });
      node.addEventListener("touchend", onTouchEnd, { passive: false });
      node.addEventListener("touchcancel", onTouchEnd, { passive: false });

      touchCleanup.current = () => {
        node.removeEventListener("touchstart", onTouchStart);
        node.removeEventListener("touchmove", onTouchMove);
        node.removeEventListener("touchend", onTouchEnd);
        node.removeEventListener("touchcancel", onTouchEnd);
      };
    },
    [disabled, finishDrag, startDrag, updateDrag],
  );

  const rootClasses = [
    "wheel-selector",
    "group/wheel inline-flex flex-col items-center gap-1 text-text-primary",
    disabled ? "wheel-selector--disabled pointer-events-none opacity-50" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const pillClasses = [
    "glass",
    "wheel-selector__pill relative flex h-20 w-16 touch-none select-none items-center justify-center overflow-hidden rounded-2xl",
    disabled ? "cursor-not-allowed" : "cursor-ns-resize",
    drag.current.active ? "wheel-selector__pill--dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Parent swipe-navigation surfaces read this to ignore wheel drags.
  return (
    <div
      className={rootClasses}
      data-swipe-navigation-ignore
      role="spinbutton"
      aria-valuemin={effectiveMin}
      aria-valuemax={effectiveMax}
      aria-valuenow={displayValue}
      aria-valuetext={`${displayValue} ${label}`}
      aria-label={label}
      aria-disabled={disabled ? "true" : undefined}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      style={{ "--wheel-selector-offset": `${dragOffset}px` } as React.CSSProperties}
    >
      <div
        ref={wheelCallbackRef}
        className={pillClasses}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <ChevronUp
          aria-hidden="true"
          className="pointer-events-none absolute top-1 left-1/2 size-3 -translate-x-1/2 text-text-secondary opacity-40"
        />
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-1/2 size-3 -translate-x-1/2 text-text-secondary opacity-40"
        />
        <div className="wheel-selector__tape" aria-hidden="true">
          {VISIBLE_OFFSETS.map((offset) => {
            const itemValue = allowedValues
              ? allowedValues[indexForValue(displayValue, allowedValues) - offset]
              : valueForOffset(displayValue, offset, safeStep);
            if (itemValue === undefined) {
              return null;
            }

            const inRange = itemValue >= effectiveMin && itemValue <= effectiveMax;
            if (!inRange) {
              return null;
            }

            const itemClasses = [
              "wheel-selector__item tabular-nums",
              offset === 0 ? "wheel-selector__item--current text-2xl font-bold" : "text-sm",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <span
                key={`${offset}-${itemValue}`}
                className={itemClasses}
                data-offset={offset}
                style={{ "--wheel-selector-item-offset": offset } as React.CSSProperties}
              >
                {itemValue}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
