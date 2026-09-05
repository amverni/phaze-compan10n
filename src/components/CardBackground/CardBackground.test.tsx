/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CardBackground } from "./CardBackground";

describe("CardBackground", () => {
  it("renders a stable viewport shell with safe-area-aware panels", () => {
    const markup = renderToStaticMarkup(
      <CardBackground
        headerContent={<span>Header</span>}
        mainContent={<span>Main</span>}
        footerContent={<span>Footer</span>}
      />,
    );

    const rootClassName = markup.match(/^<div class="([^"]+)"/)?.[1] ?? "";

    expect(rootClassName.split(" ")).toEqual(
      expect.arrayContaining(["card-background", "flex", "min-h-0", "flex-col", "overflow-x-clip"]),
    );
    expect(rootClassName).not.toContain("h-svh");
    expect(markup).toContain("card-panel-top card-panel-top-content");
    expect(markup).toContain("card-panel-bottom card-panel-bottom-content");
  });

  it("keeps mobile stable while using full viewport coverage for desktop pointers", () => {
    const css = readFileSync(resolve(__dirname, "../../index.css"), "utf8");
    const fallbackIndex = css.indexOf(".card-background {\n  --card-viewport-height: 100vh;");
    const stableViewportIndex = css.indexOf("@supports (height: 100svh)");
    const desktopViewportIndex = css.indexOf("@media (hover: hover) and (pointer: fine)");

    expect(fallbackIndex).toBeGreaterThanOrEqual(0);
    expect(stableViewportIndex).toBeGreaterThan(fallbackIndex);
    expect(desktopViewportIndex).toBeGreaterThan(stableViewportIndex);
    expect(css.slice(stableViewportIndex, desktopViewportIndex)).toContain(
      "--card-viewport-height: 100svh;",
    );
    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.card-background \{[^}]*--card-viewport-height: 100vh;[^}]*--card-panel-height: 15vh;/,
    );
  });
});
