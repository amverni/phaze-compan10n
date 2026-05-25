import type React from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { SLANT_PX } from "../../constants/layout";

const STRIPES = [
  "--color-pt-red-500",
  "--color-pt-blue-500",
  "--color-pt-green-500",
  "--color-pt-yellow-500",
];

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
const stripeHeight = 12;
const stripeGap = 5;
const totalStripeH = STRIPES.length * stripeHeight + (STRIPES.length - 1) * stripeGap;
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
  /** Crops the rendered width without affecting scale (overflow hidden). */
  width?: number | string;
}

/** Phaze Compan10n logo. */
export const Logo: React.FC<LogoProps> = ({ height, width }) => {
  const scale = height / wordHeight;
  const scaledInnerWidth = innerWidth * scale;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const targetWidth = containerWidth || (typeof width === "number" ? width : scaledInnerWidth);
  const viewBoxWidth = Math.max(innerWidth, targetWidth / scale);
  const svgWidth = viewBoxWidth * scale;
  const visibleWidth = Math.min(targetWidth, svgWidth);
  // Half the total viewBox-unit drop so the clipped visible slant equals SLANT_PX.
  const dyHalf = visibleWidth > 0 ? (SLANT_PX * viewBoxWidth) / (2 * visibleWidth) : 0;
  const textCenterX = viewBoxWidth / 2;

  return (
    <div
      ref={containerRef}
      className="overflow-x-clip overflow-y-visible shrink-0 flex justify-center"
      style={{
        width: width ?? scaledInnerWidth,
        height,
      }}
    >
      <svg
        className="block shrink-0 overflow-visible"
        viewBox={`0 0 ${viewBoxWidth} ${wordHeight}`}
        width={svgWidth}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <title>Phaze Compan10n</title>
        {/* ── Stripes ───────────────────────────────────────────────────── */}
        {STRIPES.map((color, i) => {
          const y = stripeBandTop + i * (stripeHeight + stripeGap);
          const points = [
            `0,${y + dyHalf}`, // top-left  (shifted down)
            `${viewBoxWidth},${y - dyHalf}`, // top-right (shifted up)
            `${viewBoxWidth},${y + stripeHeight - dyHalf}`, // bottom-right
            `0,${y + stripeHeight + dyHalf}`, // bottom-left
          ].join(" ");
          return <polygon key={color} points={points} fill={`var(${color})`} />;
        })}

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
