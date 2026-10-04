/** biome-ignore-all lint/style/useFilenamingConvention: Match the browser fixture's HTML entry name. */
import "@fontsource-variable/quicksand/index.css";
import "../../../index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Logo } from "../Logo";
import { LogoThemeProvider } from "../LogoThemeProvider";
import { ScorekeeperLogo } from "../ScorekeeperLogo";
import type { LogoThemeConfig } from "../themes";

const appearances = {
  light: ["#B31942", "#FFFFFF", "#0A3161"],
  dark: ["#DC2626", "#16A34A"],
} as const;
const config: LogoThemeConfig = {
  base: { scorekeeper: appearances, phaseCompan10n: appearances },
  themes: [],
};
const element = document.getElementById("appearance-root");
if (!element) throw new Error("Missing appearance fixture mount");
const root = createRoot(element);
root.render(
  <StrictMode>
    <LogoThemeProvider config={config}>
      <div className="overflow-hidden">
        <header className="flex justify-center h-24">
          <ScorekeeperLogo height={72} />
        </header>
        <main aria-label="Chooser preview" className="flex flex-col items-center gap-12 py-12">
          <ScorekeeperLogo height={112} />
          <Logo height={120} width="100%" />
        </main>
        <button type="button" onClick={() => root.unmount()}>
          Unmount preview
        </button>
      </div>
    </LogoThemeProvider>
  </StrictMode>,
);
