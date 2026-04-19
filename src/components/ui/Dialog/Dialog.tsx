import {
  DialogPanel,
  type DialogProps,
  Dialog as HeadlessDialog,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  type ElementType,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
} from "react";
import "./Dialog.css";

const panelClasses =
  "glass dialog-glass relative w-[90vw] max-w-lg h-[75svh] flex flex-col rounded-t-2xl";

const DISMISS_THRESHOLD = 0.3;

/**
 * A frosted-glass dialog that wraps Headless UI's `Dialog`.
 *
 * Accepts the same props as `@headlessui/react`'s `Dialog` and layers on
 * the app's glass styling with a slide-up transition.
 *
 * Supports swipe-down-to-dismiss: drag the handle bar, or swipe down
 * on the content area when scrolled to the top.
 *
 * Usage:
 * ```tsx
 * <Dialog open={open} onClose={setOpen}>
 *   <p>Your content here</p>
 * </Dialog>
 * ```
 */
export function Dialog<TTag extends ElementType = "div">(
  props: DialogProps<TTag> & { afterLeave?: () => void },
) {
  const { children, open, onClose, className, afterLeave, ...rest } =
    props as DialogProps<"div"> & { afterLeave?: () => void };

  const mergedPanelClasses = [panelClasses, className].filter(Boolean).join(" ");

  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Mutable drag state kept in a ref so React handlers can share it
  // without causing re-renders.
  const drag = useRef({
    startY: 0,
    offset: 0,
    active: false,
    decided: false,
    source: null as "handle" | "content" | null,
  });

  const applyOffset = useCallback((y: number) => {
    const panel = panelRef.current;
    if (!panel) return;
    if (y < 0) {
      // Dragging up — stretch effect with rubber-band resistance
      const stretch = Math.sqrt(Math.abs(y)) * 0.003;
      drag.current.offset = 0;
      panel.style.transformOrigin = "bottom";
      panel.style.transform = `scaleY(${1 + stretch})`;
    } else {
      drag.current.offset = y;
      panel.style.transformOrigin = "";
      panel.style.transform = `translateY(${y}px)`;
    }
    panel.style.transition = "none";
    panel.style.userSelect = "none";
  }, []);

  const finishGesture = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const d = drag.current;
    const threshold = panel.offsetHeight * DISMISS_THRESHOLD;

    if (d.offset > threshold) {
      panel.style.transition = "transform 200ms ease-out";
      panel.style.transform = `translateY(${panel.offsetHeight}px)`;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        (onClose as (v: boolean) => void)?.(false);
      };
      panel.addEventListener("transitionend", finish, { once: true });
      setTimeout(finish, 250);
    } else {
      panel.style.transition = "transform 200ms ease-out";
      panel.style.transform = "translateY(0) scaleY(1)";
      panel.addEventListener(
        "transitionend",
        () => {
          panel.style.transform = "";
          panel.style.transition = "";
          panel.style.transformOrigin = "";
          panel.style.userSelect = "";
        },
        { once: true },
      );
    }

    d.active = false;
    d.decided = false;
    d.source = null;
    d.offset = 0;
  }, [onClose]);

  // ── Handle bar: pointer events ──────────────────────────────
  const onHandlePointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const d = drag.current;
    d.startY = e.clientY;
    d.offset = 0;
    d.active = true;
    d.decided = true;
    d.source = "handle";
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onHandlePointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (drag.current.source !== "handle") return;
      applyOffset(e.clientY - drag.current.startY);
    },
    [applyOffset],
  );

  const onHandlePointerUp = useCallback(() => {
    if (drag.current.source !== "handle") return;
    finishGesture();
  }, [finishGesture]);

  // ── Content area: native touch listeners via callback ref ──
  // React synthetic touch events are passive in some browsers, so
  // preventDefault() is silently ignored. We attach native listeners
  // with { passive: false } via a callback ref to guarantee we can
  // prevent scrolling while dragging.
  const contentCleanup = useRef<(() => void) | null>(null);

  const contentCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Tear down previous listeners
      contentCleanup.current?.();
      contentCleanup.current = null;
      contentRef.current = node;
      if (!node) return;

      const onTouchStart = (e: TouchEvent) => {
        const d = drag.current;
        if (d.source === "handle") return;
        d.startY = e.touches[0].clientY;
        d.offset = 0;
        d.active = false;
        d.decided = false;
        d.source = null;
      };

      const onTouchMove = (e: TouchEvent) => {
        const d = drag.current;
        if (d.source === "handle") return;
        const delta = e.touches[0].clientY - d.startY;

        if (!d.decided) {
          if (Math.abs(delta) < 8) return;
          if (delta > 0 && node.scrollTop <= 0) {
            d.decided = true;
            d.active = true;
            d.source = "content";
          } else {
            d.decided = true;
            return;
          }
        }

        if (!d.active) return;
        e.preventDefault();
        applyOffset(delta);
      };

      const onTouchEnd = () => {
        const d = drag.current;
        if (d.source === "handle") return;
        if (!d.active) {
          d.decided = false;
          return;
        }
        finishGesture();
      };

      node.addEventListener("touchstart", onTouchStart, { passive: true });
      node.addEventListener("touchmove", onTouchMove, { passive: false });
      node.addEventListener("touchend", onTouchEnd, { passive: true });

      contentCleanup.current = () => {
        node.removeEventListener("touchstart", onTouchStart);
        node.removeEventListener("touchmove", onTouchMove);
        node.removeEventListener("touchend", onTouchEnd);
      };
    },
    [applyOffset, finishGesture],
  );

  return (
    <Transition show={open} afterLeave={afterLeave}>
      <HeadlessDialog {...(rest as DialogProps<"div">)} onClose={onClose} className="relative z-50">
        {/* Dim overlay */}
        <TransitionChild
          enter="dialog-backdrop-enter"
          enterFrom="dialog-backdrop-closed"
          enterTo="dialog-backdrop-open"
          leave="dialog-backdrop-leave"
          leaveFrom="dialog-backdrop-open"
          leaveTo="dialog-backdrop-closed"
        >
          <div className="fixed inset-0 bg-black/15 backdrop-blur-xs" />
        </TransitionChild>

        {/* Bottom-anchored wrapper — above the backdrop */}
        <div className="fixed inset-0 z-10 flex items-end justify-center">
          {/* Glass panel — slides up */}
          <TransitionChild
            enter="dialog-panel-enter"
            enterFrom="dialog-panel-closed"
            enterTo="dialog-panel-open"
            leave="dialog-panel-leave"
            leaveFrom="dialog-panel-open"
            leaveTo="dialog-panel-closed"
          >
            <DialogPanel ref={panelRef} className={mergedPanelClasses}>
              {/* Drag handle */}
              <div
                className="flex shrink-0 cursor-grab justify-center pt-2.5 pb-1 touch-none select-none active:cursor-grabbing"
                aria-hidden="true"
                onPointerDown={onHandlePointerDown}
                onPointerMove={onHandlePointerMove}
                onPointerUp={onHandlePointerUp}
                onPointerCancel={onHandlePointerUp}
              >
                <div className="h-1 w-9 rounded-full bg-gray-400/50 dark:bg-gray-500/50" />
              </div>
              <div
                ref={contentCallbackRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-none"
              >
                {children as ReactNode}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}
