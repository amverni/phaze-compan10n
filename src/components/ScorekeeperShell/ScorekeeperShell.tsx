import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { PageShell, type PageShellContent } from "../PageShell/PageShell";
import { PanelSurface } from "../PageShell/PanelSurface";

export function ScorekeeperShell({ headerContent, mainContent, footerContent }: PageShellContent) {
  return (
    <PageShell
      className="scorekeeper-background"
      headerDecoration={<PanelSurface />}
      footerDecoration={<PanelSurface />}
      headerContent={
        headerContent ?? (
          <div className="content-container flex h-full items-center justify-center py-2">
            <ScorekeeperLogo height={64} />
          </div>
        )
      }
      mainContent={mainContent}
      footerContent={footerContent}
    />
  );
}
