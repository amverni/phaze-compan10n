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
});
