import React from "react";

const STRIPES = [
  '--color-pt-blue-500',
  '--color-pt-red-500',
  '--color-pt-yellow-500',
  '--color-pt-green-500',
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
const stripeOverhang = 300; // stripes extend this far beyond text; width prop crops them

// Baseline positions
const phazeY = fontSize;
const companY = phazeY + capHeight + lineGap;

// Text block bounds
const textBlockTop = phazeY - capHeight;
const textBlockBottom = companY + fontSize * 0.2;

// Stripe geometry
const stripeHeight = 10;
const stripeGap = 7;
const totalStripeH = STRIPES.length * stripeHeight + (STRIPES.length - 1) * stripeGap;
const stripeCenterY = (textBlockTop + textBlockBottom) / 2 - fontSize * 0.05;
const stripeBandTop = stripeCenterY - totalStripeH / 2;

// ViewBox
const innerWidth = 420;
const vbWidth = innerWidth + stripeOverhang * 2;
const vbHeight = textBlockBottom + fontSize * 0.1 + 8;
const textCenterX = vbWidth / 2;

// Shared SVG stroke props — stroke color set via Tailwind classes on <text>
const textStrokeProps = {
  strokeWidth,
  paintOrder: "stroke fill",
  strokeLinejoin: "round" as const,
  strokeLinecap: "butt" as const,
};

interface LogoProps {
  /** Scales the entire logo. */
  height: number;
  /** Crops the rendered width without affecting scale (overflow hidden). */
  width?: number;
}

/** Phaze Compan10n logo. */
export const Logo: React.FC<LogoProps> = ({ height, width }) => {
  const scale = height / vbHeight;
  const scaledWidth = vbWidth * scale;

  return (
    <div
      className="overflow-hidden shrink-0 flex justify-center"
      style={{ width: width ?? scaledWidth, height }}
    >
      <svg
        className="block shrink-0"
        viewBox={`0 0 ${vbWidth} ${vbHeight}`}
        width={scaledWidth}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Stripes ───────────────────────────────────────────────────── */}
        {STRIPES.map((color, i) => (
          <rect
            key={color}
            x={0}
            y={stripeBandTop + i * (stripeHeight + stripeGap)}
            width={vbWidth}
            height={stripeHeight}
            rx={0}
            fill={`var(${color})`}
          />
        ))}

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
}
