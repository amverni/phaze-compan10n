import type React from "react";
import "./home.css";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { CreateButton } from "./CreateButton";
import { Disclaimer } from "./Disclaimer";

export const Home: React.FC = () => {
  return (
    <CardBackground
      mainContent={<Logo height={160} width="100%" />}
      footerContent={
        <div className="mx-auto flex h-full max-w-lg flex-col">
          <div className="flex flex-1 items-center justify-end px-6">
            <CreateButton />
          </div>
          <div className="flex justify-center">
            <Disclaimer />
          </div>
        </div>
      }
    />
  );
};
