import { HomeMenu } from "../Home/HomeMenu";
import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";

export function ScorekeeperHome() {
  return (
    <ScorekeeperShell
      headerContent={
        <div className="flex h-full items-center justify-end px-4">
          <HomeMenu experience="scorekeeper" />
        </div>
      }
      mainContent={
        <div className="content-container flex min-h-full flex-col items-center gap-6 py-6">
          <ScorekeeperLogo height={120} />
          <p className="text-center text-sm text-text-secondary">
            Manage shared Players or choose Phase Compan10n from the Scorekeepers menu.
          </p>
        </div>
      }
    />
  );
}
