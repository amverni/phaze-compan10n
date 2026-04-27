import { type ComponentProps, useEffect, useRef, useState } from "react";

const FADE_PX = 20;

function getMaskStyle(up: boolean, down: boolean): React.CSSProperties | undefined {
  let gradient: string;
  if (up && down) {
    gradient = `linear-gradient(to bottom, transparent, black ${FADE_PX}px, black calc(100% - ${FADE_PX}px), transparent)`;
  } else if (up) {
    gradient = `linear-gradient(to bottom, transparent, black ${FADE_PX}px)`;
  } else if (down) {
    gradient = `linear-gradient(to bottom, black calc(100% - ${FADE_PX}px), transparent)`;
  } else {
    return undefined;
  }

  return {
    maskImage: gradient,
    WebkitMaskImage: gradient,
  } as React.CSSProperties;
}

/**
 * Scrollable container with dynamic edge fades.
 *
 * Fades appear only when there is more content to scroll in that
 * direction — when fully scrolled to the top or bottom, the
 * corresponding edge is fully opaque so content is never obscured.
 */
export function ScrollFade({ style, className, ...props }: ComponentProps<"div">) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function update() {
      if (!el) return;
      setCanScrollUp(el.scrollTop > 1);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);

  const maskStyle = getMaskStyle(canScrollUp, canScrollDown);

  return (
    <div
      ref={ref}
      className={["overflow-y-auto", className].filter(Boolean).join(" ")}
      style={{ ...style, ...maskStyle }}
      {...props}
    />
  );
}
