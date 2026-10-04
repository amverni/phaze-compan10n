import { PageShell, type PageShellContent } from "../PageShell/PageShell";
import { PanelSurface } from "../PageShell/PanelSurface";
import { Disclaimer } from "./Disclaimer";

const disclaimerClasses = [
  "card-panel-disclaimer",
  "pointer-events-none",
  "absolute",
  "inset-x-0",
].join(" ");

/** Phase Compan10n's slanted decoration around the shared page layout. */
export function CardBackground({ headerContent, mainContent, footerContent }: PageShellContent) {
  return (
    <PageShell
      className="card-background"
      headerContent={headerContent}
      mainContent={mainContent}
      headerDecoration={<PanelSurface className="card-panel-top" />}
      footerDecoration={<PanelSurface className="card-panel-bottom" />}
      footerContent={
        <>
          {footerContent}
          <div className={disclaimerClasses}>
            <Disclaimer />
          </div>
        </>
      }
    />
  );
}
