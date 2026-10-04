import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { ScorekeeperExperience } from "../../types";
import {
  type LogoThemeConfig,
  localCalendarDate,
  logoThemeConfig,
  type RenderedPalette,
  type ResolvedPalettes,
  resolveLogoPalette,
  validateLogoThemeConfig,
} from "./themes";

const LogoPaletteContext = createContext<ResolvedPalettes | null>(null);
const DARK_APPEARANCE = "(prefers-color-scheme: dark)";
const EXPERIENCES = ["scorekeeper", "phaseCompan10n"] as const;

function resolvePalettes(config: LogoThemeConfig, now: Date, dark: boolean): ResolvedPalettes {
  const date = localCalendarDate(now);
  const appearance = dark ? "dark" : "light";
  return {
    scorekeeper: resolveLogoPalette(config, "scorekeeper", date, appearance),
    phaseCompan10n: resolveLogoPalette(config, "phaseCompan10n", date, appearance),
  };
}

function samePalettes(previous: ResolvedPalettes, next: ResolvedPalettes): boolean {
  return EXPERIENCES.every(
    (experience) =>
      previous[experience].length === next[experience].length &&
      previous[experience].every((color, index) => color === next[experience][index]),
  );
}

export function LogoThemeProvider({
  children,
  config = logoThemeConfig,
}: {
  children: ReactNode;
  config?: LogoThemeConfig;
}) {
  const [palettes, setPalettes] = useState(() => {
    validateLogoThemeConfig(config);
    return resolvePalettes(config, new Date(), window.matchMedia(DARK_APPEARANCE).matches);
  });

  useEffect(() => {
    validateLogoThemeConfig(config);
    const media = window.matchMedia(DARK_APPEARANCE);
    let timeout: number;
    function refresh() {
      const now = new Date();
      const next = resolvePalettes(config, now, media.matches);
      setPalettes((previous) => (samePalettes(previous, next) ? previous : next));
      window.clearTimeout(timeout);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timeout = window.setTimeout(refresh, midnight.getTime() - now.getTime());
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    media.addEventListener("change", refresh);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      media.removeEventListener("change", refresh);
    };
  }, [config]);

  return <LogoPaletteContext.Provider value={palettes}>{children}</LogoPaletteContext.Provider>;
}

export function useLogoPalette(experience: ScorekeeperExperience): RenderedPalette {
  const palettes = useContext(LogoPaletteContext);
  if (!palettes) throw new Error("useLogoPalette requires a LogoThemeProvider");
  return palettes[experience];
}
