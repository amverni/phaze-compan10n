import { X } from "lucide-react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import "./Toast.css";
import { Button } from "@headlessui/react";

export interface ToastHandle {
  show: (text: string) => void;
}

export interface ToastProps {
  /** Auto-dismiss duration in ms. Defaults to 3000. */
  duration?: number;
}

/**
 * A self-managing toast notification controlled via an imperative ref.
 *
 * Call `ref.current.show("message")` to display a toast. If called again
 * while already visible, the toast bounces and the timer resets.
 * Users can dismiss early by tapping the X button or swiping up.
 */
export const Toast = forwardRef<ToastHandle, ToastProps>(function Toast({ duration = 3000 }, ref) {
  const [display, setDisplay] = useState<string | null>(null);
  const [phase, setPhase] = useState<"enter" | "exit" | "swipe-exit" | "idle">("idle");
  const [bounce, setBounce] = useState(false);
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const touchStartRef = useRef<number>(0);
  const swipeYRef = useRef(0);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    setSwipeY(0);
    setSwiping(false);
    setPhase("exit");
    exitTimerRef.current = setTimeout(() => {
      setDisplay(null);
      setPhase("idle");
    }, 200);
  }, []);

  const startDismissTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    timerRef.current = setTimeout(() => {
      setPhase("exit");
      exitTimerRef.current = setTimeout(() => {
        setDisplay(null);
        setPhase("idle");
      }, 200);
    }, duration);
  }, [duration]);

  useImperativeHandle(
    ref,
    () => ({
      show(text: string) {
        if (display) {
          setDisplay(text);
          setBounce(false);
          requestAnimationFrame(() => setBounce(true));
          startDismissTimer();
        } else {
          setDisplay(text);
          setPhase("enter");
          startDismissTimer();
        }
      },
    }),
    [display, startDismissTimer],
  );

  // Swipe/drag handlers (touch + mouse)
  const draggingRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    touchStartRef.current = e.clientY;
    draggingRef.current = true;
    setSwiping(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const delta = e.clientY - touchStartRef.current;
    let y: number;
    if (delta > 0) {
      // Dragging down — rubber-band effect with diminishing returns
      y = Math.sqrt(delta) * 3;
    } else {
      // Dragging up — free movement
      y = delta;
    }
    swipeYRef.current = y;
    setSwipeY(y);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (swipeYRef.current < -30) {
      // Continue upward from current position
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setSwiping(false);
      setPhase("swipe-exit");
      exitTimerRef.current = setTimeout(() => {
        setDisplay(null);
        setPhase("idle");
        setSwipeY(0);
        swipeYRef.current = 0;
      }, 200);
    } else {
      swipeYRef.current = 0;
      setSwipeY(0);
      setSwiping(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  if (!display) return null;

  const animClass =
    phase === "exit"
      ? "toast-exit"
      : phase === "swipe-exit"
        ? "toast-swipe-exit"
        : phase === "enter"
          ? "toast-enter"
          : "";

  return (
    <div
      className={`toast glass toast-glass ${animClass} ${bounce ? "toast-bounce" : ""} ${swiping ? "is-swiping" : ""}`}
      style={
        swiping
          ? { transform: `translateY(${swipeY}px)`, opacity: swipeY < 0 ? 1 + swipeY / 60 : 1 }
          : phase === "swipe-exit"
            ? { transform: `translateY(${swipeY}px)` }
            : undefined
      }
      onAnimationEnd={(e) => {
        if (e.animationName === "toast-slide-in") setPhase("idle");
        if (e.animationName === "toast-bounce") setBounce(false);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <p className="text-sm">{display}</p>
      <Button type="button" onClick={dismiss} className="toast-dismiss" aria-label="Dismiss">
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
});
