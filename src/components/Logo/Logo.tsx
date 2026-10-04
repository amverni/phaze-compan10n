import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { SLANT_PX } from "../../constants/layout";
import { useLogoPalette } from "./LogoThemeProvider";

const stripeSlots = ["stripe-1", "stripe-2", "stripe-3", "stripe-4"];

// ── Font ─────────────────────────────────────────────────────────────────────
const FONT_FAMILY = "Quicksand Variable, sans-serif";
const FONT_WEIGHT = 600; // main text
const FONT_WEIGHT_10 = 700; // the "10" in Compan10n

// ── Fixed SVG coordinate space ────────────────────────────────────────────────
// All values are in viewBox units — the SVG scales via height/width props.
const fontSize = 72;
const smallFontSize = fontSize * 0.75;
const capHeight = fontSize * 0.72;
const lineGap = 6;
const strokeWidth = 12;

// Baseline positions
const phazeY = fontSize;
const companY = phazeY + capHeight + lineGap;

// Text block bounds
const textBlockTop = phazeY - capHeight;
const textBlockBottom = companY + fontSize * 0.2;

// Stripe geometry
const stripeGap = 5;
const totalStripeH = 63;
const stripeCenterY = (textBlockTop + textBlockBottom) / 2 - fontSize * 0.05;
const stripeBandTop = stripeCenterY - totalStripeH / 2;

// ViewBox
const innerWidth = 420;
const wordHeight = textBlockBottom + fontSize * 0.1 + 8; // just the text area

// Shared SVG stroke props — stroke color set via Tailwind classes on <text>
const textStrokeProps = {
  strokeWidth,
  paintOrder: "stroke fill",
  strokeLinejoin: "round" as const,
  strokeLinecap: "butt" as const,
};

interface LogoProps {
  /** Height of the word area — stripes may extend beyond this. */
  height: number;
  /** Width of the word area; the decorative stripe band may bleed beyond it. */
  width?: number | string;
  /** Treat height as a cap and shrink the word area to fit the available space. */
  fitToContainer?: boolean;
}

/** Phaze Compan10n logo. */
export const Logo: React.FC<LogoProps> = ({ height, width, fitToContainer = false }) => {
  const colors = useLogoPalette("phaseCompan10n");
  const stripeHeight = (totalStripeH - (colors.length - 1) * stripeGap) / colors.length;
  const scaledInnerWidth = (innerWidth * height) / wordHeight;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setContainerSize({ width, height });
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const targetWidth =
    containerSize?.width ?? (typeof width === "number" ? width : scaledInnerWidth);
  const renderedHeight = fitToContainer
    ? Math.min(height, containerSize?.height ?? height, (targetWidth * wordHeight) / innerWidth)
    : height;
  const scale = renderedHeight / wordHeight;
  const viewBoxWidth = scale > 0 ? Math.max(innerWidth, targetWidth / scale) : innerWidth;
  const svgWidth = viewBoxWidth * scale;
  const visibleWidth = Math.min(targetWidth, svgWidth);
  // Half the total viewBox-unit drop so the clipped visible slant equals SLANT_PX.
  const dyHalf = visibleWidth > 0 ? (SLANT_PX * viewBoxWidth) / (2 * visibleWidth) : 0;
  const textCenterX = viewBoxWidth / 2;

  return (
    <div
      ref={containerRef}
      className="relative shrink-0 flex items-center justify-center"
      style={{
        width: width ?? scaledInnerWidth,
        height,
        maxHeight: fitToContainer ? "100%" : undefined,
      }}
    >
      <svg
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
        viewBox={`0 0 ${viewBoxWidth} ${wordHeight}`}
        width={svgWidth}
        height={renderedHeight}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {stripeSlots.slice(0, colors.length).map((slot, i) => {
          const y = stripeBandTop + i * (stripeHeight + stripeGap);
          // Extend the same slope beyond the word area, including device insets.
          const points = [
            `${-viewBoxWidth},${y + dyHalf * 3}`,
            `${viewBoxWidth * 2},${y - dyHalf * 3}`,
            `${viewBoxWidth * 2},${y + stripeHeight - dyHalf * 3}`,
            `${-viewBoxWidth},${y + stripeHeight + dyHalf * 3}`,
          ].join(" ");
          return <polygon key={slot} points={points} fill={colors[i]} />;
        })}
      </svg>
      <svg
        className="relative block shrink-0"
        viewBox={`0 0 ${viewBoxWidth} ${wordHeight}`}
        width={svgWidth}
        height={renderedHeight}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Phaze Compan10n</title>
        {/* ── Phaze ─────────────────────────────────────────────────────── */}
        <text
          className="stroke-white dark:stroke-neutral-900"
          x={textCenterX}
          y={phazeY}
          textAnchor="middle"
          fontFamily={FONT_FAMILY}
          fontWeight={FONT_WEIGHT}
          fontSize={fontSize}
          letterSpacing={2}
          fill="var(--color-logo-text)"
          {...textStrokeProps}
        >
          Phaze
        </text>

        {/* ── Compan10n ─────────────────────────────────────────────────── */}
        <text
          className="stroke-white dark:stroke-neutral-900"
          x={textCenterX}
          y={companY}
          textAnchor="middle"
          fontFamily={FONT_FAMILY}
          fontWeight={FONT_WEIGHT}
          fontSize={fontSize}
          letterSpacing={2}
          fill="var(--color-logo-text)"
          {...textStrokeProps}
        >
          Compan
          <tspan fontSize={smallFontSize} fontWeight={FONT_WEIGHT_10} {...textStrokeProps}>
            10
          </tspan>
          n
        </text>
      </svg>
    </div>
  );
};
