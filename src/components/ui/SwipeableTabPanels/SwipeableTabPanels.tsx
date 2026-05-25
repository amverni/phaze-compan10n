import { TabPanels as HeadlessTabPanels, type TabPanelsProps } from "@headlessui/react";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { mergeClassName } from "../mergeClassName";

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

interface SwipeableTabPanelsProps extends Omit<TabPanelsProps<"div">, "children" | "onChange"> {
  selectedIndex: number;
  onChange: (nextIndex: number) => void;
  children: ReactNode;
}

function findTouchById(touchList: TouchList, id: number) {
  for (let index = 0; index < touchList.length; index += 1) {
    const touch = touchList[index];
    if (touch.identifier === id) return touch;
  }

  return null;
}

function getTrackTransform(index: number, width: number, offset = 0) {
  return `translate3d(${-(index * width) + offset}px, 0, 0)`;
}

function renderStaticTabPanel(panel: ReactNode) {
  if (!isValidElement(panel)) {
    return panel;
  }

  // SwipeableTabPanels is intentionally for Headless UI TabPanel children.
  // This cast only adds Headless UI's supported `static` prop so panels stay mounted while swiping.
  return cloneElement(panel as ReactElement<{ static?: boolean }>, { static: true });
}

export function SwipeableTabPanels(props: SwipeableTabPanelsProps) {
  const { selectedIndex, onChange, children, ...tabPanelsProps } = props;
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

  useLayoutEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const panels = Children.toArray(children);
  const panelCount = panels.length;
  const [visualIndex, setVisualIndex] = useState(selectedIndex);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const gestureRef = useRef<GestureState | null>(null);
  const swipeCommitTargetRef = useRef<number | null>(null);
  const rollbackFrameRef = useRef<number | null>(null);
  const trackElementRef = useRef<HTMLDivElement | null>(null);
  const selectedIndexRef = useRef(selectedIndex);
  const onChangeRef = useRef(onChange);
  const panelCountRef = useRef(panelCount);
  const containerWidthRef = useRef(containerWidth);
  const prefersReducedMotionRef = useRef(prefersReducedMotion);

  selectedIndexRef.current = selectedIndex;
  onChangeRef.current = onChange;
  panelCountRef.current = panelCount;
  containerWidthRef.current = containerWidth;
  prefersReducedMotionRef.current = prefersReducedMotion;

  useEffect(() => {
    const cancelRollbackFrame = () => {
      if (rollbackFrameRef.current === null) return;

      cancelAnimationFrame(rollbackFrameRef.current);
      rollbackFrameRef.current = null;
    };

    if (swipeCommitTargetRef.current === selectedIndex) {
      swipeCommitTargetRef.current = null;
      cancelRollbackFrame();
      return;
    }

    if (swipeCommitTargetRef.current !== null) {
      swipeCommitTargetRef.current = null;
      cancelRollbackFrame();
    }

    gestureRef.current = null;
    setTransitionEnabled(false);
    setVisualIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    if (!containerElement) return;

    const cancelRollbackFrame = () => {
      if (rollbackFrameRef.current === null) return;

      cancelAnimationFrame(rollbackFrameRef.current);
      rollbackFrameRef.current = null;
    };

    const applyTrackTransform = (index: number, offset = 0) => {
      if (!trackElementRef.current) return;

      trackElementRef.current.style.transform = getTrackTransform(
        index,
        containerWidthRef.current,
        offset,
      );
    };

    const snapToSelected = () => {
      gestureRef.current = null;
      if (prefersReducedMotionRef.current) {
        applyTrackTransform(selectedIndexRef.current);
      }
      setVisualIndex(selectedIndexRef.current);
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
    };

    const handleTouchMove = (event: TouchEvent) => {
      const gesture = gestureRef.current;
      if (!gesture) return;

      if (event.touches.length !== 1) {
        snapToSelected();
        return;
      }

      const touch = event.touches[0];
      if (touch.identifier !== gesture.id) {
        snapToSelected();
        return;
      }

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

      if (trackElementRef.current) {
        trackElementRef.current.style.transition = "none";
      }
      applyTrackTransform(currentIndex, nextDragOffset);
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
      if (prefersReducedMotionRef.current) {
        applyTrackTransform(nextIndex);
      }

      if (nextIndex !== currentIndex) {
        swipeCommitTargetRef.current = nextIndex;
        onChangeRef.current(nextIndex);

        cancelRollbackFrame();
        rollbackFrameRef.current = requestAnimationFrame(() => {
          rollbackFrameRef.current = null;
          if (swipeCommitTargetRef.current !== nextIndex) {
            return;
          }

          swipeCommitTargetRef.current = null;
          setTransitionEnabled(!prefersReducedMotionRef.current);
          setVisualIndex(selectedIndexRef.current);
          if (prefersReducedMotionRef.current) {
            applyTrackTransform(selectedIndexRef.current);
          }
        });
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
      cancelRollbackFrame();
      containerElement.removeEventListener("touchstart", handleTouchStart);
      containerElement.removeEventListener("touchmove", handleTouchMove);
      containerElement.removeEventListener("touchend", handleTouchEnd);
      containerElement.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [containerElement]);

  const mergedClassName = mergeClassName("overflow-x-hidden", tabPanelsProps);

  return (
    <HeadlessTabPanels {...tabPanelsProps} ref={setContainerElement} className={mergedClassName}>
      <div
        ref={trackElementRef}
        className="flex min-h-full will-change-transform"
        style={{
          transform: getTrackTransform(visualIndex, containerWidth),
          transition:
            transitionEnabled && !prefersReducedMotion
              ? `transform ${SNAP_TRANSITION_MS}ms ease-out`
              : "none",
        }}
        onTransitionEnd={(event) => {
          if (event.currentTarget === event.target) {
            setTransitionEnabled(false);
          }
        }}
      >
        {panels.map((panel, index) => (
          <div
            key={isValidElement(panel) ? panel.key : index}
            className="min-h-full w-full min-w-full shrink-0"
            inert={index !== visualIndex ? true : undefined}
            aria-hidden={index !== visualIndex ? true : undefined}
          >
            {renderStaticTabPanel(panel)}
          </div>
        ))}
      </div>
    </HeadlessTabPanels>
  );
}
