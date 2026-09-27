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
      expect.arrayContaining([
        "page-shell",
        "card-background",
        "flex",
        "min-h-0",
        "flex-col",
        "overflow-x-clip",
      ]),
    );
    expect(rootClassName).not.toContain("h-svh");
    expect(markup).toContain("<span>Header</span>");
    expect(markup).toContain("<span>Main</span>");
    expect(markup).toContain("<span>Footer</span>");
    expect(markup).toContain(
      "This tool is not affiliated with, endorsed by, or sponsored by Mattel.",
    );
  });

  it("keeps mobile stable while using full viewport coverage for desktop pointers", () => {
    const css = readFileSync(resolve(__dirname, "../../index.css"), "utf8");
    const fallbackIndex = css.indexOf(".page-shell {\n  --page-shell-viewport-height: 100vh;");
    const stableViewportIndex = css.indexOf("@supports (height: 100svh)");
    const desktopViewportIndex = css.indexOf("@media (hover: hover) and (pointer: fine)");

    expect(fallbackIndex).toBeGreaterThanOrEqual(0);
    expect(stableViewportIndex).toBeGreaterThan(fallbackIndex);
    expect(desktopViewportIndex).toBeGreaterThan(stableViewportIndex);
    expect(css.slice(stableViewportIndex, desktopViewportIndex)).toContain(
      "--page-shell-viewport-height: 100svh;",
    );
    expect(css).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\) \{\s*\.page-shell \{[^}]*--page-shell-viewport-height: 100vh;[^}]*--page-shell-panel-height: 15vh;/,
    );
  });
});
