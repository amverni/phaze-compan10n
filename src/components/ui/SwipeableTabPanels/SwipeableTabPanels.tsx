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

const SWIPE_COMMIT_DISTANCE_RATIO = 0.25;
const MIN_SWIPE_COMMIT_DISTANCE_PX = 72;
const HORIZONTAL_DOMINANCE_RATIO = 2;
const INTENT_DISTANCE_PX = 8;
const EDGE_RESISTANCE = 3;
const SNAP_TRANSITION_MS = 200;
const SWIPE_NAVIGATION_IGNORE_SELECTOR = "[data-swipe-navigation-ignore]";
const SWIPE_NAVIGATION_ROOT_SELECTOR = "[data-swipe-navigation-root]";
const INTERACTIVE_CONTROL_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='menuitem']",
  "[role='option']",
  "[role='radio']",
  "[role='switch']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type GestureMode = "pending" | "dragging" | "cancelled";

interface GestureState {
  id: number;
  startX: number;
  startY: number;
  startedOnInteractiveControl: boolean;
  interactiveControlElement: HTMLElement | null;
  mode: GestureMode;
}

interface SuppressedNativeClick {
  target: HTMLElement;
  expiresAt: number;
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

function getSwipeCommitDistance(width: number) {
  return Math.max(MIN_SWIPE_COMMIT_DISTANCE_PX, Math.round(width * SWIPE_COMMIT_DISTANCE_RATIO));
}

function getDragOffset(deltaX: number, currentIndex: number, panelCount: number) {
  const atFirstPanel = currentIndex === 0 && deltaX > 0;
  const atLastPanel = currentIndex === panelCount - 1 && deltaX < 0;

  return atFirstPanel || atLastPanel ? deltaX / EDGE_RESISTANCE : deltaX;
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
  const [visualOffset, setVisualOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const gestureRef = useRef<GestureState | null>(null);
  const swipeCommitTargetRef = useRef<number | null>(null);
  const rollbackFrameRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const trackElementRef = useRef<HTMLDivElement | null>(null);
  const suppressedNativeClickRef = useRef<SuppressedNativeClick | null>(null);
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

  useLayoutEffect(() => {
    const cancelRollbackFrame = () => {
      if (rollbackFrameRef.current === null) return;

      cancelAnimationFrame(rollbackFrameRef.current);
      rollbackFrameRef.current = null;
    };

    if (swipeCommitTargetRef.current === selectedIndex) {
      swipeCommitTargetRef.current = null;
      return;
    }

    if (swipeCommitTargetRef.current !== null) {
      swipeCommitTargetRef.current = null;
      cancelRollbackFrame();
    }

    gestureRef.current = null;
    dragOffsetRef.current = 0;
    setTransitionEnabled(false);
    setVisualIndex(selectedIndex);
    setVisualOffset(0);
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

    const scheduleSnap = (
      fromIndex: number,
      toIndexOrResolver: number | (() => number),
      offset: number,
    ) => {
      gestureRef.current = null;
      dragOffsetRef.current = offset;
      const resolveToIndex = () =>
        typeof toIndexOrResolver === "function" ? toIndexOrResolver() : toIndexOrResolver;
      if (prefersReducedMotionRef.current) {
        const toIndex = resolveToIndex();
        dragOffsetRef.current = 0;
        setTransitionEnabled(false);
        setVisualIndex(toIndex);
        setVisualOffset(0);
        applyTrackTransform(toIndex);
        return;
      }

      cancelRollbackFrame();
      if (trackElementRef.current) {
        trackElementRef.current.style.transition = "none";
      }
      applyTrackTransform(fromIndex, offset);
      setTransitionEnabled(false);
      setVisualIndex(fromIndex);
      setVisualOffset(offset);

      rollbackFrameRef.current = requestAnimationFrame(() => {
        rollbackFrameRef.current = null;
        dragOffsetRef.current = 0;
        setTransitionEnabled(true);
        setVisualIndex(resolveToIndex());
        setVisualOffset(0);
      });
    };

    const snapToSelected = () => {
      scheduleSnap(selectedIndexRef.current, selectedIndexRef.current, dragOffsetRef.current);
    };

    const handleTouchStart = (event: TouchEvent) => {
      suppressedNativeClickRef.current = null;
      const targetElement = event.target instanceof Element ? event.target : null;
      const nearestSwipeRoot = targetElement?.closest(SWIPE_NAVIGATION_ROOT_SELECTOR);
      const interactiveControlElement = targetElement?.closest(INTERACTIVE_CONTROL_SELECTOR);

      if (
        panelCountRef.current <= 1 ||
        event.touches.length !== 1 ||
        targetElement?.closest(SWIPE_NAVIGATION_IGNORE_SELECTOR) !== null ||
        (nearestSwipeRoot !== null && nearestSwipeRoot !== containerElement)
      ) {
        gestureRef.current = null;
        return;
      }

      const touch = event.touches[0];
      gestureRef.current = {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        startedOnInteractiveControl: interactiveControlElement !== null,
        interactiveControlElement:
          interactiveControlElement instanceof HTMLElement ? interactiveControlElement : null,
        mode: "pending",
      };
      dragOffsetRef.current = 0;
      if (trackElementRef.current) {
        trackElementRef.current.style.transition = "none";
      }
      setTransitionEnabled(false);
      setVisualIndex(selectedIndexRef.current);
      setVisualOffset(0);
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
      const swipeCommitDistance = getSwipeCommitDistance(containerWidthRef.current);

      if (gesture.mode === "pending") {
        if (absX < INTENT_DISTANCE_PX && absY < INTENT_DISTANCE_PX) {
          return;
        }

        if (absY >= INTENT_DISTANCE_PX && absY > absX / HORIZONTAL_DOMINANCE_RATIO) {
          gestureRef.current = { ...gesture, mode: "cancelled" };
          return;
        }

        const dragStartDistance = gesture.startedOnInteractiveControl
          ? swipeCommitDistance
          : INTENT_DISTANCE_PX;

        if (absX >= dragStartDistance && absX >= absY * HORIZONTAL_DOMINANCE_RATIO) {
          gestureRef.current = { ...gesture, mode: "dragging" };
        } else {
          return;
        }
      }

      const activeGesture = gestureRef.current;
      if (activeGesture?.mode !== "dragging") {
        return;
      }

      if (!activeGesture.startedOnInteractiveControl || absX >= swipeCommitDistance) {
        event.preventDefault();
      }
      const currentIndex = selectedIndexRef.current;
      const nextDragOffset = getDragOffset(deltaX, currentIndex, panelCountRef.current);

      dragOffsetRef.current = nextDragOffset;
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
      const deltaY = touch.clientY - gesture.startY;
      const currentIndex = selectedIndexRef.current;
      const swipeCommitDistance = getSwipeCommitDistance(containerWidthRef.current);
      const dragOffset = getDragOffset(deltaX, currentIndex, panelCountRef.current);
      let nextIndex = currentIndex;

      if (gesture.mode !== "dragging") {
        if (
          gesture.mode === "pending" &&
          gesture.startedOnInteractiveControl &&
          gesture.interactiveControlElement &&
          (Math.abs(deltaX) >= INTENT_DISTANCE_PX || Math.abs(deltaY) >= INTENT_DISTANCE_PX)
        ) {
          suppressedNativeClickRef.current = {
            target: gesture.interactiveControlElement,
            expiresAt: performance.now() + 400,
          };
          gesture.interactiveControlElement.click();
        }
        return;
      }

      if (Math.abs(deltaX) >= swipeCommitDistance) {
        const candidateIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
        if (candidateIndex >= 0 && candidateIndex < panelCountRef.current) {
          nextIndex = candidateIndex;
        }
      }

      if (nextIndex !== currentIndex) {
        swipeCommitTargetRef.current = nextIndex;
        onChangeRef.current(nextIndex);
        scheduleSnap(
          currentIndex,
          () => {
            if (selectedIndexRef.current === nextIndex) {
              return nextIndex;
            }

            swipeCommitTargetRef.current = null;
            return selectedIndexRef.current;
          },
          dragOffset,
        );
        return;
      }

      scheduleSnap(currentIndex, nextIndex, dragOffset);
    };

    const handleTouchCancel = () => {
      snapToSelected();
    };

    const handleClickCapture = (event: MouseEvent) => {
      const suppressedClick = suppressedNativeClickRef.current;
      if (!suppressedClick) return;

      if (performance.now() > suppressedClick.expiresAt) {
        suppressedNativeClickRef.current = null;
        return;
      }

      if (
        event.isTrusted &&
        event.target instanceof Node &&
        suppressedClick.target.contains(event.target)
      ) {
        suppressedNativeClickRef.current = null;
        event.preventDefault();
        event.stopPropagation();
      }
    };

    containerElement.addEventListener("touchstart", handleTouchStart, { passive: true });
    containerElement.addEventListener("touchmove", handleTouchMove, { passive: false });
    containerElement.addEventListener("touchend", handleTouchEnd, { passive: true });
    containerElement.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    containerElement.addEventListener("click", handleClickCapture, true);

    return () => {
      cancelRollbackFrame();
      containerElement.removeEventListener("touchstart", handleTouchStart);
      containerElement.removeEventListener("touchmove", handleTouchMove);
      containerElement.removeEventListener("touchend", handleTouchEnd);
      containerElement.removeEventListener("touchcancel", handleTouchCancel);
      containerElement.removeEventListener("click", handleClickCapture, true);
    };
  }, [containerElement]);

  const mergedClassName = mergeClassName("overflow-x-hidden", tabPanelsProps);

  return (
    <HeadlessTabPanels
      {...tabPanelsProps}
      data-swipe-navigation-root=""
      ref={setContainerElement}
      className={mergedClassName}
    >
      <div
        ref={trackElementRef}
        className="flex min-h-full will-change-transform"
        style={{
          transform: getTrackTransform(visualIndex, containerWidth, visualOffset),
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
