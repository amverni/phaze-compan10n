import type { ReactNode } from "react";

export interface PageShellContent {
  headerContent?: ReactNode;
  mainContent?: ReactNode;
  footerContent?: ReactNode;
}

export interface PageShellProps extends PageShellContent {
  className?: string;
  /** Noninteractive surfaces behind the header and footer content. */
  headerDecoration?: ReactNode;
  footerDecoration?: ReactNode;
}

const panelClasses = ["pointer-events-none", "relative", "z-10", "shrink-0"].join(" ");
const decorationClasses = ["pointer-events-none", "absolute", "inset-0"].join(" ");
const contentClasses = ["pointer-events-auto", "relative"].join(" ");
const mainClasses = [
  "page-shell-main",
  "relative",
  "z-0",
  "min-h-0",
  "flex-1",
  "overflow-x-visible",
  "overflow-y-auto",
].join(" ");

export function PageShell({
  headerContent,
  mainContent,
  footerContent,
  className,
  headerDecoration,
  footerDecoration,
}: PageShellProps) {
  return (
    <div
      className={["page-shell flex min-h-0 flex-col overflow-x-clip", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={panelClasses}>
        {headerDecoration && (
          <div aria-hidden className={decorationClasses}>
            {headerDecoration}
          </div>
        )}
        <div className={["page-shell-header", contentClasses].join(" ")}>{headerContent}</div>
      </div>
      <div className={mainClasses}>{mainContent}</div>
      <div className={panelClasses}>
        {footerDecoration && (
          <div aria-hidden className={decorationClasses}>
            {footerDecoration}
          </div>
        )}
        <div aria-hidden className="page-shell-bottom-bleed" />
        <div className={["page-shell-footer", contentClasses].join(" ")}>{footerContent}</div>
      </div>
    </div>
  );
}
