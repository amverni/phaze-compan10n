import type React from "react";
import "./home.css";
import { Logo } from "../Logo/Logo";

export const Home: React.FC = () => {
  return (
    <>
      <h1 className="home">Hello from TanStack Router</h1>
      <Logo height={160} />
    </>
  );
};
