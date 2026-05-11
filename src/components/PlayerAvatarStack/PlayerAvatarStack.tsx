import { useLayoutEffect, useRef, useState } from "react";
import type { Player } from "../../types";
import { PlayerAvatar, type PlayerAvatarVariant } from "../PlayerAvatar/PlayerAvatar";

const OVERLAP_PX = 6;

export interface PlayerAvatarStackProps {
  players: Player[];
  /**
   * Optional upper cap on visible avatars. When unset, the stack fits as many avatars
   * as it can in its own allocated width (place it as `flex-1` in a flex row).
   */
  maxVisible?: number;
  /** Avatar size passed through to `PlayerAvatar`. Defaults to 20. */
  size?: number;
  /** Avatar variant passed through to `PlayerAvatar`. Defaults to `"initials"`. */
  variant?: PlayerAvatarVariant;
}

export function PlayerAvatarStack({
  players,
  maxVisible,
  size = 20,
  variant = "initials",
}: PlayerAvatarStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  // PlayerAvatar renders at `size + 10` (see PlayerAvatar.tsx: `pad = size + 10`).
  // The "+N" chip uses the same render size so they line up visually.
  const itemSize = size + 10;

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
    if (visibleCount === 0 && hardCap > 0) {
      visibleCount = 1;
    }
  }

  const visible = players.slice(0, visibleCount);
  const hiddenCount = players.length - visible.length;

  return (
    <div ref={containerRef} className="flex min-w-0 flex-1 -space-x-1.5">
      {visible.map((player) => (
        <span key={player.id} className="inline-flex rounded-full">
          <PlayerAvatar player={player} size={size} variant={variant} />
        </span>
      ))}
      {hiddenCount > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-neutral-200 font-semibold text-text-secondary dark:bg-neutral-700"
          style={{
            width: itemSize,
            height: itemSize,
            fontSize: Math.round(size * 0.625),
          }}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}
