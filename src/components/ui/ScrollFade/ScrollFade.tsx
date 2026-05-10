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
      const nextCanScrollUp = el.scrollTop > 1;
      const nextCanScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      setCanScrollUp((current) => (current === nextCanScrollUp ? current : nextCanScrollUp));
      setCanScrollDown((current) => (current === nextCanScrollDown ? current : nextCanScrollDown));
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, { childList: true, subtree: true });

    return () => {
      el.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
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
