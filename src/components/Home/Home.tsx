import type React from "react";
import "./home.css";
import { CardBackground } from "../CardBackground/CardBackground";
import { Logo } from "../Logo/Logo";
import { CreateButton } from "./CreateButton";

export const Home: React.FC = () => {
  return (
    <CardBackground
      mainContent={<Logo height={160} width="100%" />}
      footerContent={<CreateButton />}
    />
  );
};
