import { type ComponentProps, useEffect, useRef, useState } from "react";

const FADE_PX = 20;

const fadeBase = "pointer-events-none sticky inset-x-0 z-10 transition-opacity duration-150";
const fadeTopClasses = `${fadeBase} top-0 bg-linear-to-b from-white to-transparent dark:from-neutral-900`;
const fadeBottomClasses = `${fadeBase} bottom-0 bg-linear-to-t from-white to-transparent dark:from-neutral-900`;

/**
 * Scrollable container with dynamic edge fades.
 *
 * Fades appear only when there is more content to scroll in that
 * direction — when fully scrolled to the top or bottom, the
 * corresponding edge is fully opaque so content is never obscured.
 *
 * Implemented with sticky-positioned gradient overlays rather than a
 * CSS `mask-image` on the scroll element: a `mask` would establish a
 * stacking context that isolates `backdrop-filter` on descendant glass
 * surfaces (causing them to render lighter than glass elsewhere on
 * the page).
 */
export function ScrollFade({ style, className, children, ...props }: ComponentProps<"div">) {
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

  return (
    <div
      ref={ref}
      className={["overflow-y-auto", className].filter(Boolean).join(" ")}
      style={style}
      {...props}
    >
      <div
        aria-hidden
        className={fadeTopClasses}
        style={{ height: FADE_PX, marginBottom: -FADE_PX, opacity: canScrollUp ? 1 : 0 }}
      />
      {children}
      <div
        aria-hidden
        className={fadeBottomClasses}
        style={{ height: FADE_PX, marginTop: -FADE_PX, opacity: canScrollDown ? 1 : 0 }}
      />
    </div>
  );
}
