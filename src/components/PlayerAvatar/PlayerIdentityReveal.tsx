import type { PlayerIdentity } from "../../types";
import { PlayerAvatar, type PlayerAvatarVariant } from "./PlayerAvatar";
import "./playerIdentityMotion.css";

interface PlayerIdentityRevealProps {
  player: PlayerIdentity;
  expanded: boolean;
  size?: number;
  collapsedVariant?: PlayerAvatarVariant;
}

/** Opt-in name presentation; activation and expansion belong to the containing surface. */
export function PlayerIdentityReveal({
  player,
  expanded,
  size = 16,
  collapsedVariant = "initials",
}: PlayerIdentityRevealProps) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className="inline-flex shrink-0">
        <PlayerAvatar player={player} size={size} variant={expanded ? "icon" : collapsedVariant} />
      </span>
      <span
        className="player-identity-motion min-w-0 truncate font-medium"
        style={{
          visibility: expanded ? "visible" : "hidden",
          opacity: expanded ? 1 : 0,
          transform: expanded ? "translateX(0px)" : "translateX(-4px)",
        }}
      >
        {player.name}
      </span>
    </span>
  );
}
