import type React from "react";

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
 *
 * Panel geometry (slant, clip-paths, shadow) is defined in index.css —
 * adjust the `--slant` custom property there to change the angle.
 */
export const CardBackground: React.FC<CardBackgroundProps> = ({
  headerContent,
  mainContent,
  footerContent,
}) => {
  return (
    <div className="flex h-svh flex-col overflow-x-clip">
      {/* ── Top panel: flat top, angled bottom ────────────────────── */}
      <div className="relative z-10">
        {/* Shadow layer (no children → never re-rendered by interactions) */}
        <div aria-hidden className="card-panel-shadow absolute inset-0">
          <div className="card-panel-top h-full bg-white dark:bg-neutral-900" />
        </div>
        {/* Content layer */}
        <div className="card-panel-top card-panel-top-content relative h-[15svh] bg-white dark:bg-neutral-900">
          {headerContent}
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="card-panel-main relative z-0 min-h-0 flex-1 overflow-x-visible overflow-y-auto">
        {mainContent}
      </div>

      {/* ── Bottom panel: angled top, flat bottom ─────────────────── */}
      <div className="relative z-10">
        {/* Shadow layer */}
        <div aria-hidden className="card-panel-shadow absolute inset-0">
          <div className="card-panel-bottom h-full bg-white dark:bg-neutral-900" />
        </div>
        {/* Content layer */}
        <div className="card-panel-bottom card-panel-bottom-content relative h-[15svh] bg-white dark:bg-neutral-900">
          {footerContent}
        </div>
      </div>
    </div>
  );
};
