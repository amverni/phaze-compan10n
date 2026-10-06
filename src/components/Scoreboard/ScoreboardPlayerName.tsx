import { useLayoutEffect, useRef, useState } from "react";
import type { PlayerIdentity } from "../../types";
import { PlayerAvatar } from "../PlayerAvatar/PlayerAvatar";
import { PlayerIdentityReveal } from "../PlayerAvatar/PlayerIdentityReveal";
import { PlainButton } from "../ui";

interface ScoreboardPlayerNameProps {
  player: PlayerIdentity;
  expanded: boolean;
  onToggle: () => void;
}

export function ScoreboardPlayerName({ player, expanded, onToggle }: ScoreboardPlayerNameProps) {
  const compactRef = useRef<HTMLSpanElement>(null);
  const namedRef = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState({ compact: 0, named: 0 });

  useLayoutEffect(() => {
    const compact = compactRef.current;
    const named = namedRef.current;
    if (!compact || !named) return;
    const measure = () => {
      const next = {
        compact: compact.getBoundingClientRect().width,
        named: named.getBoundingClientRect().width,
      };
      setWidths((previous) =>
        previous.compact === next.compact && previous.named === next.named ? previous : next,
      );
    };
    measure();
    // Observe natural identity sizes, not the animated width, including font and viewport changes.
    const observer = new ResizeObserver(measure);
    observer.observe(compact);
    observer.observe(named);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <PlainButton
        type="button"
        aria-label={`${player.name}: ${expanded ? "Hide" : "Show"} all Player names`}
        aria-expanded={expanded}
        onClick={onToggle}
        className="absolute inset-0 z-10 focus-visible:outline-offset-[-3px]"
      />
      <span
        aria-hidden="true"
        className="scoreboard-identity player-identity-motion"
        style={{ width: widths.compact ? (expanded ? widths.named : widths.compact) : undefined }}
      >
        <span
          ref={compactRef}
          className="scoreboard-identity-compact player-identity-motion"
          style={{ opacity: expanded ? 0 : 1, visibility: expanded ? "hidden" : "visible" }}
        >
          <PlayerAvatar player={player} variant="icon-initials" />
        </span>
        <span
          ref={namedRef}
          className="scoreboard-identity-named player-identity-motion"
          style={{ opacity: expanded ? 1 : 0, visibility: expanded ? "visible" : "hidden" }}
        >
          <PlayerIdentityReveal player={player} expanded={expanded} collapsedVariant="icon" />
        </span>
      </span>
    </>
  );
}
