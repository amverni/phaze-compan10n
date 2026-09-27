import { TriangleAlert } from "lucide-react";
import { getColorEntry } from "../../data/constants/colors";
import type { PlayerIdentity } from "../../types";
import { getContrastColor } from "../../utils";

export type PlayerAvatarVariant = "icon" | "initials" | "icon-initials";

export interface PlayerAvatarProps {
  player: Pick<PlayerIdentity, "color" | "name">;
  size?: number;
  /** What to render inside the badge. Defaults to `"icon"`. */
  variant?: PlayerAvatarVariant;
}

export function getPlayerAvatarBoxSize(size: number): number {
  return size + 10;
}

const FALLBACK_BACKGROUND = "#525252";
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const CSS_COLOR_LIKE_PATTERN =
  /^(#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(.+\)|hsla?\(.+\)|var\(.+\))$/i;
const RGB_COLOR_FUNCTION_PATTERN = /^rgba?\(\s*(.+?)\s*\)$/i;
const HSL_COLOR_FUNCTION_PATTERN = /^hsla?\(\s*(.+?)\s*\)$/i;

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

function getFallbackBackgroundColor(color: string): string {
  const trimmedColor = color.trim();
  return CSS_COLOR_LIKE_PATTERN.test(trimmedColor) ? trimmedColor : FALLBACK_BACKGROUND;
}

function getAvatarTextColor(backgroundColor: string): "#000000" | "#ffffff" {
  const contrastHex = toContrastHex(backgroundColor);
  if (!contrastHex) return "#ffffff";

  return getReadableTextColor(contrastHex);
}

function toContrastHex(color: string): string | null {
  const trimmedColor = color.trim();

  if (HEX_COLOR_PATTERN.test(trimmedColor)) {
    if (trimmedColor.length === 4) {
      const [, r, g, b] = trimmedColor;
      return `#${r}${r}${g}${g}${b}${b}`;
    }

    return trimmedColor;
  }

  if (/^#[0-9a-f]{4}$/i.test(trimmedColor)) {
    const [, r, g, b] = trimmedColor;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  if (/^#[0-9a-f]{8}$/i.test(trimmedColor)) {
    return trimmedColor.slice(0, 7);
  }

  const rgbHex = rgbFunctionToHex(trimmedColor);
  if (rgbHex) return rgbHex;

  const hslHex = hslFunctionToHex(trimmedColor);
  if (hslHex) return hslHex;

  return null;
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((value) => toHexByte(value)).join("")}`;
}

function rgbFunctionToHex(color: string): string | null {
  const match = color.match(RGB_COLOR_FUNCTION_PATTERN);
  if (!match) return null;

  const channels = getCssColorChannels(match[1]);
  if (channels.length < 3) return null;

  return rgbToHex(
    getRgbChannelValue(channels[0]),
    getRgbChannelValue(channels[1]),
    getRgbChannelValue(channels[2]),
  );
}

function hslFunctionToHex(color: string): string | null {
  const match = color.match(HSL_COLOR_FUNCTION_PATTERN);
  if (!match) return null;

  const channels = getCssColorChannels(match[1]);
  if (channels.length < 3) return null;
  const hue = getHueDegrees(channels[0]);
  if (hue === null) return null;

  const [red, green, blue] = hslToRgb(
    hue,
    Number.parseFloat(channels[1]),
    Number.parseFloat(channels[2]),
  );
  return rgbToHex(red, green, blue);
}

function getCssColorChannels(value: string): string[] {
  const colorChannels = value.split("/")[0]?.trim() ?? "";
  return colorChannels.includes(",")
    ? colorChannels.split(",").map((channel) => channel.trim())
    : colorChannels.split(/\s+/).filter(Boolean);
}

function getRgbChannelValue(channel: string): number {
  const value = Number.parseFloat(channel);
  return channel.trim().endsWith("%") ? (value / 100) * 255 : value;
}

function getHueDegrees(channel: string): number | null {
  const trimmedChannel = channel.trim().toLowerCase();
  const value = Number.parseFloat(trimmedChannel);
  if (!Number.isFinite(value)) return null;

  if (trimmedChannel.endsWith("turn")) return value * 360;
  if (trimmedChannel.endsWith("grad")) return value * 0.9;
  if (trimmedChannel.endsWith("rad")) return (value * 180) / Math.PI;
  return value;
}

function toHexByte(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
}

function getReadableTextColor(hexColor: string): "#000000" | "#ffffff" {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  const luminance = getRelativeLuminance(red, green, blue);
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);

  return blackContrast >= whiteContrast ? "#000000" : "#ffffff";
}

function getRelativeLuminance(red: number, green: number, blue: number): number {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hslToRgb(
  hue: number,
  saturationPercent: number,
  lightnessPercent: number,
): [number, number, number] {
  const normalizedHue = (((hue % 360) + 360) % 360) / 360;
  const saturation = Math.max(0, Math.min(100, saturationPercent)) / 100;
  const lightness = Math.max(0, Math.min(100, lightnessPercent)) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const huePrime = normalizedHue * 6;
  const secondary = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const match = lightness - chroma / 2;
  const [red, green, blue] =
    huePrime < 1
      ? [chroma, secondary, 0]
      : huePrime < 2
        ? [secondary, chroma, 0]
        : huePrime < 3
          ? [0, chroma, secondary]
          : huePrime < 4
            ? [0, secondary, chroma]
            : huePrime < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];

  return [
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ];
}

export function PlayerAvatar({ player, size = 16, variant = "icon" }: PlayerAvatarProps) {
  const entry = getColorEntry(player.color);
  const Icon = entry?.icon ?? TriangleAlert;
  const pad = getPlayerAvatarBoxSize(size);
  const backgroundColor = entry?.hex ?? getFallbackBackgroundColor(player.color);
  const fg = entry ? getContrastColor(entry.hex) : getAvatarTextColor(backgroundColor);
  const initials = getInitials(player.name);
  const useIconFallbackInitials = variant === "icon" && !entry;
  const initialsFontSize = useIconFallbackInitials ? Math.max(size - 2, 1) : size;

  if (variant === "initials" || useIconFallbackInitials) {
    return (
      <span
        aria-hidden={useIconFallbackInitials ? true : undefined}
        className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none"
        style={{
          width: pad,
          height: pad,
          backgroundColor,
          color: fg,
          fontSize: initialsFontSize,
        }}
      >
        {initials}
      </span>
    );
  }

  if (variant === "icon-initials") {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full font-semibold leading-none"
        style={{
          height: pad,
          paddingInline: Math.round(pad * 0.35),
          backgroundColor,
          color: fg,
          fontSize: size,
        }}
      >
        <Icon size={size} strokeWidth={1.75} color={fg} />
        <span>{initials}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: pad,
        height: pad,
        backgroundColor,
      }}
    >
      <Icon size={size} strokeWidth={1.5} color={fg} />
    </span>
  );
}
