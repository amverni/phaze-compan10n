import type React from "react";
import { Disclaimer } from "./Disclaimer";

interface CardBackgroundProps {
  /** Content rendered inside the angled top panel (e.g. logo, page header). */
  headerContent?: React.ReactNode;
  /** Main page content rendered between the top and bottom panels. */
  mainContent?: React.ReactNode;
  /** Content rendered inside the angled bottom panel (e.g. actions, footer). */
  footerContent?: React.ReactNode;
}

const shellClasses = ["card-background", "flex", "min-h-0", "flex-col", "overflow-x-clip"].join(
  " ",
);
const panelWrapperClasses = ["pointer-events-none", "relative", "z-10", "shrink-0"].join(" ");
const shadowPanelClasses = ["card-panel-surface", "h-full"].join(" ");
const topShadowPanelClasses = ["card-panel-top", shadowPanelClasses].join(" ");
const panelContentBaseClasses = ["card-panel-surface", "pointer-events-auto", "relative"].join(" ");
const topPanelClasses = [panelContentBaseClasses, "card-panel-top", "card-panel-top-content"].join(
  " ",
);
const mainPanelClasses = [
  "card-panel-main",
  "relative",
  "z-0",
  "min-h-0",
  "flex-1",
  "overflow-x-visible",
  "overflow-y-auto",
].join(" ");
const bottomPanelClasses = [
  panelContentBaseClasses,
  "card-panel-bottom",
  "card-panel-bottom-content",
].join(" ");
const bottomShadowPanelClasses = ["card-panel-bottom", shadowPanelClasses].join(" ");
const disclaimerClasses = [
  "card-panel-disclaimer",
  "pointer-events-none",
  "absolute",
  "inset-x-0",
].join(" ");

/**
 * Reusable Phase-10-card-style page layout.
 *
 * Renders a top panel (flat top, angled bottom) and a bottom panel
 * (angled top, flat bottom) that each occupy 15 % of the stable mobile
 * viewport, plus any device safe-area inset on their outside edge. Both
 * panels match the page background colour and use a drop-shadow on the
 * angled edge to create depth.
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
    <div className={shellClasses}>
      {/* ── Top panel: flat top, angled bottom ────────────────────── */}
      <div className={panelWrapperClasses}>
        {/* Shadow layer (no children → never re-rendered by interactions) */}
        <div aria-hidden className="card-panel-shadow absolute inset-0">
          <div className={topShadowPanelClasses} />
        </div>
        {/* Content layer */}
        <div className={topPanelClasses}>{headerContent}</div>
      </div>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className={mainPanelClasses}>{mainContent}</div>

      {/* ── Bottom panel: angled top, flat bottom ─────────────────── */}
      <div className={panelWrapperClasses}>
        {/* Shadow layer */}
        <div aria-hidden className="card-panel-shadow absolute inset-0">
          <div className={bottomShadowPanelClasses} />
        </div>
        {/* Content layer */}
        <div className={bottomPanelClasses}>
          {footerContent}
          <div className={disclaimerClasses}>
            <Disclaimer />
          </div>
        </div>
      </div>
    </div>
  );
};
