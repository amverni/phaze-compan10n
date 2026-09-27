import { PageShell, type PageShellContent } from "../PageShell/PageShell";
import { Disclaimer } from "./Disclaimer";

const shadowClasses = ["card-panel-shadow", "h-full"].join(" ");
const surfaceClasses = ["card-panel-surface", "h-full"].join(" ");
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
      headerDecoration={
        <div className={shadowClasses}>
          <div className={["card-panel-top", surfaceClasses].join(" ")} />
        </div>
      }
      footerDecoration={
        <div className={shadowClasses}>
          <div className={["card-panel-bottom", surfaceClasses].join(" ")} />
        </div>
      }
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
