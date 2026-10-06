import { useLayoutEffect, useRef, useState } from "react";
import type { PlayerIdentity } from "../../types";
import {
  getPlayerAvatarBoxSize,
  PlayerAvatar,
  type PlayerAvatarVariant,
} from "../PlayerAvatar/PlayerAvatar";
import { PlayerIdentityReveal } from "../PlayerAvatar/PlayerIdentityReveal";

const OVERLAP_PX = 6;
const EXPANDED_GAP_PX = 8;
const overflowCountClasses = [
  "inline-flex items-center justify-center rounded-full font-semibold",
  "bg-neutral-200 text-text-secondary dark:bg-neutral-700",
].join(" ");

export interface PlayerAvatarStackProps {
  players: readonly PlayerIdentity[];
  /**
   * Optional upper cap on visible avatars. When unset, the stack fits as many avatars
   * as it can in its own allocated width (place it as `flex-1` in a flex row).
   */
  maxVisible?: number;
  /** Allow no avatars or overflow chip when the allocated width cannot fit them. */
  allowEmpty?: boolean;
  /** Avatar size passed through to `PlayerAvatar`. Defaults to 20. */
  size?: number;
  /** Avatar variant passed through to `PlayerAvatar`. Defaults to `"initials"`. */
  variant?: PlayerAvatarVariant;
  /** Opt into a controlled, named vertical list. Omit to retain the ordinary stack. */
  expanded?: boolean;
}

export function PlayerAvatarStack({
  players,
  maxVisible,
  allowEmpty = false,
  size = 16,
  variant = "initials",
  expanded,
}: PlayerAvatarStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const itemSize = getPlayerAvatarBoxSize(size);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setAvailableWidth(el.clientWidth);

    const ro = new ResizeObserver(([entry]) => {
      setAvailableWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function widthForCount(n: number, withChip: boolean) {
    const items = n + (withChip ? 1 : 0);
    if (items === 0) return 0;
    return itemSize + (items - 1) * (itemSize - OVERLAP_PX);
  }

  const hardCap = Math.min(players.length, maxVisible ?? players.length);

  let visibleCount: number;
  if (availableWidth === null) {
    visibleCount = hardCap;
  } else {
    visibleCount = 0;
    for (let n = 1; n <= hardCap; n++) {
      const withChip = n < players.length;
      if (widthForCount(n, withChip) <= availableWidth) visibleCount = n;
      else break;
    }
    if (!allowEmpty && visibleCount === 0 && hardCap > 0) {
      visibleCount = 1;
    }
  }

  const visible = players.slice(0, visibleCount);
  const hiddenCount = players.length - visible.length;
  const showHiddenCount =
    hiddenCount > 0 &&
    (!allowEmpty || availableWidth === null || widthForCount(visibleCount, true) <= availableWidth);
  const overflowCountStyle = { width: itemSize, height: itemSize, fontSize: size };

  if (expanded !== undefined) {
    return (
      <div
        ref={containerRef}
        className="player-identity-motion relative min-w-0 flex-1 overflow-hidden"
        style={{
          height: expanded
            ? players.length * itemSize + Math.max(0, players.length - 1) * EXPANDED_GAP_PX
            : itemSize,
        }}
      >
        {players.map((player, index) => (
          <span
            key={player.id}
            className="player-identity-motion absolute top-0 left-0 w-full"
            style={{
              transform: expanded
                ? `translate(0px, ${index * (itemSize + EXPANDED_GAP_PX)}px)`
                : `translate(${Math.min(index, visibleCount) * (itemSize - OVERLAP_PX)}px, 0px)`,
              visibility: expanded || index < visibleCount ? "visible" : "hidden",
              opacity: expanded || index < visibleCount ? 1 : 0,
            }}
          >
            <PlayerIdentityReveal
              player={player}
              size={size}
              expanded={expanded}
              collapsedVariant={variant}
            />
          </span>
        ))}
        {showHiddenCount && (
          <span
            className={["player-identity-motion absolute top-0", overflowCountClasses].join(" ")}
            style={{
              ...overflowCountStyle,
              left: visibleCount * (itemSize - OVERLAP_PX),
              visibility: expanded ? "hidden" : "visible",
              opacity: expanded ? 0 : 1,
            }}
          >
            +{hiddenCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex min-w-0 flex-1 -space-x-1.5">
      {visible.map((player) => (
        <span key={player.id} className="inline-flex rounded-full">
          <PlayerAvatar player={player} size={size} variant={variant} />
        </span>
      ))}
      {showHiddenCount && (
        <span className={overflowCountClasses} style={overflowCountStyle}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}
