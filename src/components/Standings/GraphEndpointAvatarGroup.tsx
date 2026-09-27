import type { PlayerIdentity } from "../../types";
import { getPlayerAvatarBoxSize, PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";

const LATEST_AVATAR_ICON_SIZE = 16;
const LATEST_AVATAR_BOX_SIZE = getPlayerAvatarBoxSize(LATEST_AVATAR_ICON_SIZE);
const LATEST_AVATAR_RADIUS = LATEST_AVATAR_BOX_SIZE / 2;
const LATEST_AVATAR_OVERLAP = 6;

interface GraphEndpointAvatarGroupProps {
  label: string;
  players: readonly PlayerIdentity[];
  x: number;
  y: number;
  graphWidth: number;
  graphHeight: number;
}

export function GraphEndpointAvatarGroup({
  label,
  players,
  x,
  y,
  graphWidth,
  graphHeight,
}: GraphEndpointAvatarGroupProps) {
  return (
    <div
      role="img"
      aria-label={`Latest ${label}: ${players.map((player) => player.name).join(", ")}`}
      className="absolute flex"
      style={{
        left: getEndpointGroupPosition(
          (x / graphWidth) * 100,
          getEndpointGroupWidth(players.length),
        ),
        ...getEndpointGroupBlockPosition((y / graphHeight) * 100),
        maxWidth: "100%",
        flexWrap: "wrap",
        rowGap: 2,
        boxSizing: "border-box",
        paddingLeft: LATEST_AVATAR_OVERLAP,
      }}
    >
      {players.map((player, index) => (
        <span
          key={player.id}
          className="inline-flex rounded-full"
          style={{ marginLeft: index === 0 ? undefined : -LATEST_AVATAR_OVERLAP }}
        >
          <PlayerAvatar player={player} size={LATEST_AVATAR_ICON_SIZE} variant="icon" />
        </span>
      ))}
    </div>
  );
}

function getEndpointGroupPosition(anchorPercent: number, groupSize: number): string {
  return `clamp(0px, calc(${anchorPercent}% - ${LATEST_AVATAR_RADIUS}px), calc(100% - ${groupSize}px))`;
}

function getEndpointGroupBlockPosition(anchorPercent: number) {
  if (anchorPercent < 50) {
    return { top: getEndpointGroupPosition(anchorPercent, LATEST_AVATAR_BOX_SIZE) };
  }

  return { bottom: getEndpointGroupPosition(100 - anchorPercent, LATEST_AVATAR_BOX_SIZE) };
}

function getEndpointGroupWidth(playerCount: number): number {
  return (
    LATEST_AVATAR_OVERLAP +
    LATEST_AVATAR_BOX_SIZE +
    Math.max(playerCount - 1, 0) * (LATEST_AVATAR_BOX_SIZE - LATEST_AVATAR_OVERLAP)
  );
}
