import { TriangleAlert } from "lucide-react";
import { getColorEntry } from "../../data/constants/colors";
import { getContrastColor } from "../../utils";

export interface PlayerAvatarProps {
  color: string;
  size?: number;
}

export function PlayerAvatar({ color, size = 20 }: PlayerAvatarProps) {
  const entry = getColorEntry(color);

  if (!entry) {
    return <TriangleAlert size={size} strokeWidth={1.5} color="#9CA3AF" />;
  }

  const Icon = entry.icon;
  const pad = size + 10;
  const fg = getContrastColor(entry.hex);

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
