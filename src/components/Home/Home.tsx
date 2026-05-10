import type React from "react";
import "./home.css";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { ActiveGames } from "./ActiveGames";
import { CreateButton } from "./CreateButton";
import { Disclaimer } from "./Disclaimer";
import { HomeMenu } from "./HomeMenu";

export const Home: React.FC = () => {
  return (
    <CardBackground
      headerContent={
        <div className="relative z-10 mx-auto flex h-full w-full items-center justify-end px-4">
          <HomeMenu />
        </div>
      }
      mainContent={
        <div className="flex h-full min-h-0 flex-col">
          <Logo height={160} width="100%" />
          <div className="min-h-0 flex-1">
            <div className="content-container h-full">
              <ActiveGames />
            </div>
          </div>
        </div>
      }
      footerContent={
        <>
          <div className="content-container flex h-full justify-end">
            <CreateButton />
          </div>
          {/* Absolutely positioned so it never pushes the button up.
              The card-panel-bottom-content (parent) is `relative`. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4">
            <Disclaimer />
          </div>
        </>
      }
    />
  );
};
