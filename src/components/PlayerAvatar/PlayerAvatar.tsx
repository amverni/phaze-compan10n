import { TriangleAlert } from "lucide-react";
import { getColorEntry } from "../../data/constants/colors";

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
  return <Icon size={size} strokeWidth={1.5} color={entry.hex} />;
}
