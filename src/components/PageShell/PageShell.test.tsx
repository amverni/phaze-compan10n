import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageShell } from "./PageShell";

describe("PageShell", () => {
  it("renders page content without Phase-specific branding or a disclaimer", () => {
    const markup = renderToStaticMarkup(
      <PageShell
        headerContent={<h1>Scorekeeper</h1>}
        mainContent={<p>Game content</p>}
        footerContent={<button type="button">Back</button>}
      />,
    );
    expect(markup).toContain("<h1>Scorekeeper</h1>");
    expect(markup).toContain("<p>Game content</p>");
    expect(markup).toContain(">Back</button>");
    expect(markup).not.toContain("Mattel");
    expect(markup).not.toContain("card-panel");
    expect(markup).not.toContain("Phaze Compan10n");
  });
});
