import type React from "react";
import "./home.css";
import { CardBackground } from "../CardBackground/CardBackground";
import { PhaseGamesList } from "../Games/PhaseGamesList";
import { Logo } from "../Logo/Logo";
import { CreateButton } from "./CreateButton";
import { HomeMenu } from "./HomeMenu";
import { PhasesCardButton } from "./PhasesCardButton";

export const Home: React.FC = () => {
  return (
    <CardBackground
      headerContent={
        <div className="content-container relative z-10 flex h-full items-center justify-between">
          <PhasesCardButton />
          <HomeMenu experience="phaseCompan10n" />
        </div>
      }
      mainContent={
        <div className="flex h-full min-h-0 flex-col">
          <Logo height={120} width="100%" />
          <div className="min-h-0 flex-1">
            <div className="content-container h-full">
              <PhaseGamesList activeOnly />
            </div>
          </div>
        </div>
      }
      footerContent={
        <div className="content-container flex h-full justify-end">
          <CreateButton to="/phaseCompan10n/create" />
        </div>
      }
    />
  );
};
