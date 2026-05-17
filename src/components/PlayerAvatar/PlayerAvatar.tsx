import { TriangleAlert } from "lucide-react";
import { getColorEntry } from "../../data/constants/colors";
import type { ColorEntry, Player } from "../../types";
import { getContrastColor } from "../../utils";

export type PlayerAvatarVariant = "icon" | "initials" | "icon-initials";

export interface PlayerAvatarProps {
  player: Pick<Player, "color" | "name">;
  size?: number;
  /** What to render inside the badge. Defaults to `"icon"`. */
  variant?: PlayerAvatarVariant;
}

const FALLBACK_ENTRY: ColorEntry = {
  hex: "#525252",
  name: "Unknown",
  icon: TriangleAlert,
};

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

export function PlayerAvatar({ player, size = 16, variant = "icon" }: PlayerAvatarProps) {
  const entry = getColorEntry(player.color) ?? FALLBACK_ENTRY;
  const Icon = entry.icon;
  const pad = size + 10;
  const fg = getContrastColor(entry.hex);
  const initials = variant === "icon" ? null : getInitials(player.name);

  if (variant === "initials") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold leading-none"
        style={{
          width: pad,
          height: pad,
          backgroundColor: entry.hex,
          color: fg,
          fontSize: size,
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
          backgroundColor: entry.hex,
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
        backgroundColor: entry.hex,
      }}
    >
      <Icon size={size} strokeWidth={1.5} color={fg} />
    </span>
  );
}
