import type { Locator } from "playwright";
import { expect } from "vitest";

export function actionAppearance(action: Locator) {
  return action.evaluate((element) => {
    const style = getComputedStyle(element);
    const icon = element.querySelector("svg");
    if (!icon) throw new Error("Missing action icon");
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Missing color sampling context");
    const channels = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    return {
      surface: channels(style.backgroundColor),
      icon: channels(getComputedStyle(icon).color),
      opacity: Number(style.opacity),
      animation: style.animationName,
    };
  });
}

function luminance(channels: number[]) {
  const [red, green, blue] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

export async function expectReadyAction(action: Locator, neutral: Locator, ready: boolean) {
  await expect.poll(() => action.isEnabled()).toBe(ready);
  const appearance = await actionAppearance(action);
  const neutralAppearance = await actionAppearance(neutral);
  expect(appearance.animation).toBe("none");
  if (ready) {
    expect(appearance.surface).not.toEqual(neutralAppearance.surface);
    const [red, green, blue, alpha] = appearance.surface;
    expect(blue).toBeGreaterThan(green);
    expect(green).toBeGreaterThan(red);
    expect(alpha).toBe(255);
    expect(appearance.icon).toEqual([255, 255, 255, 255]);
    expect(
      (luminance(appearance.icon) + 0.05) / (luminance(appearance.surface) + 0.05),
    ).toBeGreaterThanOrEqual(3);
    expect(appearance.opacity).toBe(1);
  } else {
    expect(appearance.surface).toEqual(neutralAppearance.surface);
    expect(appearance.icon).toEqual(neutralAppearance.icon);
    expect(appearance.opacity).toBe(0.4);
  }
}
