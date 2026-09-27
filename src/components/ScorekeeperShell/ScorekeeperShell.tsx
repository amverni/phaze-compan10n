import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { PageShell, type PageShellContent } from "../PageShell/PageShell";

export function ScorekeeperShell({ headerContent, mainContent, footerContent }: PageShellContent) {
  return (
    <PageShell
      className="scorekeeper-background"
      headerDecoration={<div className="glass relative h-full" />}
      footerDecoration={<div className="glass relative h-full" />}
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
