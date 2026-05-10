import type { ComponentProps } from "react";

const FADE_PX = 20;

const FADE_TOP_MASK = `linear-gradient(to bottom, transparent 0, black ${FADE_PX}px, black)`;

/**
 * Scrollable container with a top-edge fade.
 *
 * The top edge always fades from transparent to opaque so content
 * scrolling out actually fades out (alpha) rather than being painted
 * over by a colored gradient. There is no bottom fade — callers rely
 * on the surrounding layout (e.g. CardBackground's angled footer
 * panel) to cover content scrolling off the bottom.
 *
 * Implementation notes:
 *
 * - Uses `mask-image` to achieve a true alpha fade. A `mask`
 *   establishes a stacking context that isolates `backdrop-filter`
 *   on descendant glass surfaces; without a backdrop color those
 *   surfaces render lighter than glass elsewhere on the page. We
 *   work around this by giving the scroll container a background
 *   matching the body (`bg-white dark:bg-neutral-900`) so the
 *   isolated `backdrop-filter` samples the same color.
 * - The mask is applied unconditionally so the top edge of the
 *   container's background fades in. This (a) avoids any visual
 *   pop when transitioning between "at rest" and "scrolled" states
 *   and (b) lets a sibling drop-shadow above the container (e.g.
 *   a TabList sitting directly on top of the scroll area) blend
 *   naturally into the scroll surface instead of being clipped by
 *   the opaque background.
 */
export function ScrollFade({ style, className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={["overflow-y-auto bg-white dark:bg-neutral-900", className]
        .filter(Boolean)
        .join(" ")}
      style={{ ...style, maskImage: FADE_TOP_MASK, WebkitMaskImage: FADE_TOP_MASK }}
      {...props}
    >
      {children}
    </div>
  );
}
