import { TabPanels as HeadlessTabPanels } from "@headlessui/react";
import {
  Children,
  type ComponentPropsWithoutRef,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const SWIPE_COMMIT_DISTANCE_PX = 50;
const HORIZONTAL_DOMINANCE_RATIO = 2;
const INTENT_DISTANCE_PX = 8;
const EDGE_RESISTANCE = 3;
const SNAP_TRANSITION_MS = 200;
const SWIPE_NAVIGATION_IGNORE_SELECTOR = "[data-swipe-navigation-ignore]";

type GestureMode = "pending" | "dragging" | "cancelled";

interface GestureState {
  id: number;
  startX: number;
  startY: number;
  mode: GestureMode;
}

interface SwipeableTabPanelsProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange"> {
  selectedIndex: number;
  onChange: (nextIndex: number) => void;
  children: ReactNode;
}

function findTouchById(touchList: TouchList, id: number) {
  return Array.from(touchList).find((touch) => touch.identifier === id) ?? null;
}

export function SwipeableTabPanels({
  selectedIndex,
  onChange,
  children,
  className,
  ...props
}: SwipeableTabPanelsProps) {
  const [containerElement, setContainerElement] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useLayoutEffect(() => {
    if (!containerElement) return;

    const updateWidth = () => setContainerWidth(containerElement.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerElement);
    return () => observer.disconnect();
  }, [containerElement]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const [visualIndex, setVisualIndex] = useState(selectedIndex);
  const [dragOffset, setDragOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const gestureRef = useRef<GestureState | null>(null);
  const swipeCommitTargetRef = useRef<number | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  const onChangeRef = useRef(onChange);
  const panelCountRef = useRef(panelCount);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);

  selectedIndexRef.current = selectedIndex;
  onChangeRef.current = onChange;
  panelCountRef.current = panelCount;
  prefersReducedMotionRef.current = prefersReducedMotion;

  useEffect(() => {
    if (swipeCommitTargetRef.current === selectedIndex) {
      swipeCommitTargetRef.current = null;
      return;
    }

    gestureRef.current = null;
    setTransitionEnabled(false);
    setDragOffset(0);
    setVisualIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!containerElement) return;

    const snapToSelected = () => {
      gestureRef.current = null;
      setVisualIndex(selectedIndexRef.current);
      setDragOffset(0);
      setTransitionEnabled(!prefersReducedMotionRef.current);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (
        panelCountRef.current <= 1 ||
        event.touches.length !== 1 ||
        (event.target instanceof Element &&
          event.target.closest(SWIPE_NAVIGATION_IGNORE_SELECTOR) !== null)
      ) {
        gestureRef.current = null;
        return;
      }

      const touch = event.touches[0];
      gestureRef.current = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        mode: "pending",
      };
      setTransitionEnabled(false);
      setVisualIndex(selectedIndexRef.current);
      setDragOffset(0);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      if (event.touches.length !== 1) {
        snapToSelected();
        return;
      }

      const touch = findTouchById(event.touches, gesture.id);
      if (!touch) return;

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (gesture.mode === "pending") {
        if (absX < INTENT_DISTANCE_PX && absY < INTENT_DISTANCE_PX) {
          return;
        }

        if (absY >= INTENT_DISTANCE_PX && absY > absX / HORIZONTAL_DOMINANCE_RATIO) {
          gestureRef.current = { ...gesture, mode: "cancelled" };
          return;
        }

        if (absX >= INTENT_DISTANCE_PX && absX >= absY * HORIZONTAL_DOMINANCE_RATIO) {
          gestureRef.current = { ...gesture, mode: "dragging" };
        } else {
          return;
        }
      }

      if (gestureRef.current?.mode !== "dragging") {
        return;
      }

      event.preventDefault();

      const currentIndex = selectedIndexRef.current;
      const atFirstPanel = currentIndex === 0 && deltaX > 0;
      const atLastPanel = currentIndex === panelCountRef.current - 1 && deltaX < 0;
      const nextDragOffset = atFirstPanel || atLastPanel ? deltaX / EDGE_RESISTANCE : deltaX;

      setTransitionEnabled(false);
      setVisualIndex(currentIndex);
      setDragOffset(nextDragOffset);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      gestureRef.current = null;
      if (!gesture) return;

      const touch = findTouchById(event.changedTouches, gesture.id);
      if (!touch) {
        snapToSelected();
        return;
      }

      const deltaX = touch.clientX - gesture.startX;
      const currentIndex = selectedIndexRef.current;
      let nextIndex = currentIndex;

      if (gesture.mode === "dragging" && Math.abs(deltaX) >= SWIPE_COMMIT_DISTANCE_PX) {
        const candidateIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
        if (candidateIndex >= 0 && candidateIndex < panelCountRef.current) {
          nextIndex = candidateIndex;
        }
      }

      setTransitionEnabled(!prefersReducedMotionRef.current);
      setVisualIndex(nextIndex);
      setDragOffset(0);

      if (nextIndex !== currentIndex) {
        swipeCommitTargetRef.current = nextIndex;
        onChangeRef.current(nextIndex);
      }
    };

    const handleTouchCancel = () => {
      snapToSelected();
    };

    containerElement.addEventListener("touchstart", handleTouchStart, { passive: true });
    containerElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    containerElement.addEventListener("touchend", handleTouchEnd, { passive: true });
    containerElement.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      containerElement.removeEventListener("touchstart", handleTouchStart);
      containerElement.removeEventListener("touchmove", handleTouchMove);
      containerElement.removeEventListener("touchend", handleTouchEnd);
      containerElement.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [containerElement]);

  const transformX = -(visualIndex * containerWidth) + dragOffset;
  const mergedClassName = ["overflow-x-hidden", className].filter(Boolean).join(" ");

  return (
    <HeadlessTabPanels {...props} ref={setContainerElement} className={mergedClassName}>
      <div
        className="flex min-h-full will-change-transform"
        style={{
          transform: `translate3d(${transformX}px, 0, 0)`,
          transition:
            transitionEnabled && !prefersReducedMotion
              ? `transform ${SNAP_TRANSITION_MS}ms ease-out`
              : "none",
        }}
        onTransitionEnd={() => setTransitionEnabled(false)}
      >
        {panels.map((panel, index) => (
          <div
            key={isValidElement(panel) ? panel.key : index}
            className="min-h-full w-full min-w-full shrink-0"
            inert={index !== selectedIndex ? true : undefined}
            aria-hidden={index !== selectedIndex}
          >
            {isValidElement(panel)
              ? cloneElement(panel as ReactElement<{ static?: boolean }>, { static: true })
              : panel}
          </div>
        ))}
      </div>
    </HeadlessTabPanels>
  );
}
