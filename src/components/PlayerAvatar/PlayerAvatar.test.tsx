import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlayerAvatar } from "./PlayerAvatar";

describe("PlayerAvatar", () => {
  it("falls back to smaller initials in the same-size circle for icon avatars without icon entries", () => {
    const markup = renderToStaticMarkup(
      <PlayerAvatar player={{ name: "Casey Jones", color: "#123456" }} size={16} variant="icon" />,
    );

    expect(markup).toContain(">CJ</span>");
    expect(markup).toContain("width:26px;height:26px");
    expect(markup).toContain("background-color:#123456");
    expect(markup).toContain("font-size:14px");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain("lucide-triangle-alert");
  });

  it("keeps non-fallback initials at the requested avatar text size", () => {
    const initialsMarkup = renderToStaticMarkup(
      <PlayerAvatar player={{ name: "Casey Jones", color: "Jam" }} size={16} variant="initials" />,
    );
    const iconInitialsMarkup = renderToStaticMarkup(
      <PlayerAvatar
        player={{ name: "Casey Jones", color: "#123456" }}
        size={16}
        variant="icon-initials"
      />,
    );

    expect(initialsMarkup).toContain("font-size:16px");
    expect(iconInitialsMarkup).toContain("font-size:16px");
  });

  it("keeps the warning icon for icon-initials fallback while using a valid player color", () => {
    const markup = renderToStaticMarkup(
      <PlayerAvatar
        player={{ name: "Casey Jones", color: "#123456" }}
        size={16}
        variant="icon-initials"
      />,
    );

    expect(markup).toContain("lucide-triangle-alert");
    expect(markup).toContain(">CJ</span>");
    expect(markup).toContain("background-color:#123456");
  });

  it("uses neutral gray for unresolved invalid player colors", () => {
    const markup = renderToStaticMarkup(
      <PlayerAvatar
        player={{ name: "Casey Jones", color: "not-a-real-color" }}
        size={16}
        variant="icon"
      />,
    );

    expect(markup).toContain(">CJ</span>");
    expect(markup).toContain("background-color:#525252");
  });

  it.each([
    "rgb(255, 255, 255)",
    "rgb(255 255 255)",
    "rgb(100% 100% 100%)",
    "hsl(0, 0%, 100%)",
    "hsl(0 0% 100%)",
    "hsl(0 0% 100% / 1)",
    "#ffffffff",
  ])("uses dark text for light fallback color %s", (color) => {
    const markup = renderToStaticMarkup(
      <PlayerAvatar player={{ name: "Casey Jones", color }} size={16} variant="icon" />,
    );

    expect(markup).toContain(">CJ</span>");
    expect(markup).toContain("color:#000000");
  });

  it.each([
    "#00ff00",
    "rgb(0 255 0)",
    "hsl(120 100% 50%)",
  ])("uses WCAG contrast for saturated light fallback color %s", (color) => {
    const markup = renderToStaticMarkup(
      <PlayerAvatar player={{ name: "Casey Jones", color }} size={16} variant="icon" />,
    );

    expect(markup).toContain(">CJ</span>");
    expect(markup).toContain("color:#000000");
  });

  it.each([
    "hsl(0.66turn 100% 50%)",
    "hsl(4.18879rad 100% 50%)",
    "hsl(266.666grad 100% 50%)",
  ])("parses HSL hue units for fallback color %s", (color) => {
    const markup = renderToStaticMarkup(
      <PlayerAvatar player={{ name: "Casey Jones", color }} size={16} variant="icon" />,
    );

    expect(markup).toContain(">CJ</span>");
    expect(markup).toContain("color:#ffffff");
  });
});
