import type React from "react";
import { SLANT_PX } from "../../constants/layout";

/** Slant as a CSS length string for use in polygon / padding expressions. */
const SLANT = `${SLANT_PX}px`;

/** Shared filter string — shadow colour comes from CSS custom properties
 *  that flip between light mode (dark shadow) and dark mode (light glow). */
const PANEL_SHADOW =
  "drop-shadow(0 0 12px var(--card-shadow-lg)) drop-shadow(0 0 4px var(--card-shadow-sm))";

interface CardBackgroundProps {
  /** Content rendered inside the angled top panel (e.g. logo, page header). */
  headerContent?: React.ReactNode;
  /** Main page content rendered between the top and bottom panels. */
  mainContent?: React.ReactNode;
  /** Content rendered inside the angled bottom panel (e.g. actions, footer). */
  footerContent?: React.ReactNode;
}

/**
 * Reusable Phase-10-card-style page layout.
 *
 * Renders a top panel (flat top, angled bottom) and a bottom panel
 * (angled top, flat bottom) that each occupy 15 % of the viewport height.
 * Both panels match the page background colour and use a drop-shadow on
 * the angled edge to create depth.
 */
export const CardBackground: React.FC<CardBackgroundProps> = ({
  headerContent,
  mainContent,
  footerContent,
}) => {
  const topClip = `polygon(0 0, 100% 0, 100% calc(100% - ${SLANT}), 0% 100%)`;
  const bottomClip = `polygon(0 ${SLANT}, 100% 0, 100% 100%, 0% 100%)`;

  return (
    <div className="flex h-svh flex-col overflow-x-clip">
      {/* ── Top panel: flat top, angled bottom ────────────────────── */}
      <div className="relative z-10">
        {/* Shadow layer (no children → never re-rendered by interactions) */}
        <div aria-hidden className="absolute inset-0" style={{ filter: PANEL_SHADOW }}>
          <div className="h-full bg-white dark:bg-neutral-900" style={{ clipPath: topClip }} />
        </div>
        {/* Content layer */}
        <div
          className="relative h-[15svh] bg-white dark:bg-neutral-900"
          style={{ clipPath: topClip, paddingBottom: SLANT }}
        >
          {headerContent}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div
        className="relative z-0 min-h-0 flex-1 overflow-y-auto"
        style={{ marginTop: `-${SLANT}`, paddingTop: SLANT, marginBottom: `-${SLANT}`, paddingBottom: SLANT }}
      >
        {mainContent}
      </div>

      {/* ── Bottom panel: angled top, flat bottom ─────────────────── */}
      <div className="relative z-10">
        {/* Shadow layer */}
        <div aria-hidden className="absolute inset-0" style={{ filter: PANEL_SHADOW }}>
          <div className="h-full bg-white dark:bg-neutral-900" style={{ clipPath: bottomClip }} />
        </div>
        {/* Content layer */}
        <div
          className="relative h-[15svh] bg-white dark:bg-neutral-900"
          style={{ clipPath: bottomClip, paddingTop: SLANT }}
        >
          {footerContent}
        </div>
      </div>
    </div>
  );
};
