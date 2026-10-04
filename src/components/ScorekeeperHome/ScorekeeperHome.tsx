import { GenericGamesList } from "../Games/GenericGamesList";
import { CreateButton } from "../Home/CreateButton";
import { HomeMenu } from "../Home/HomeMenu";
import { ScorekeeperLogo } from "../Logo/ScorekeeperLogo";
import { ScorekeeperShell } from "../ScorekeeperShell/ScorekeeperShell";

export function ScorekeeperHome() {
  return (
    <ScorekeeperShell
      headerContent={
        <div className="content-container flex h-full items-center justify-end">
          <HomeMenu experience="scorekeeper" />
        </div>
      }
      mainContent={
        <div className="content-container flex min-h-full flex-col items-center gap-6 py-6">
          <ScorekeeperLogo height={120} />
          <GenericGamesList activeOnly />
        </div>
      }
      footerContent={
        <div className="content-container flex h-full justify-end">
          <CreateButton to="/scorekeeper/create" />
        </div>
      }
    />
  );
}
