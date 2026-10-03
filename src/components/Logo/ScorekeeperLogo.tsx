import { useLayoutEffect, useRef, useState } from "react";

interface ScorekeeperLogoProps {
  height: number;
}

const stripes = [
  "--color-scorekeeper-gold",
  "--color-scorekeeper-silver",
  "--color-scorekeeper-bronze",
];

// Center of Quicksand 600's visible ink at size 72 and baseline 79, including the p.
const stripeCenterY = 59.5625;

export function ScorekeeperLogo({ height }: ScorekeeperLogoProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [stripeBounds, setStripeBounds] = useState({ x: 0, width: 560 });

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const updateBounds = () => {
      const transform = svg.getScreenCTM();
      if (!transform || transform.a <= 0) return;
      // Convert viewport edges to SVG units without changing the word's scale or position.
      setStripeBounds({
        x: -transform.e / transform.a,
        width: document.documentElement.clientWidth / transform.a,
      });
    };
    updateBounds();
    const observer = new ResizeObserver(updateBounds);
    // Safe Area padding can move a capped logo without resizing the SVG itself.
    for (let element: Element | null = svg; element; element = element.parentElement) {
      observer.observe(element);
    }
    window.addEventListener("resize", updateBounds);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateBounds);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none block w-full max-w-xl max-h-full shrink-0 overflow-visible"
      viewBox="0 0 560 112"
      height={height}
      role="img"
    >
      <title>Scorekeeper</title>
      {stripes.map((color, index) => (
        <rect
          key={color}
          x={stripeBounds.x}
          y={stripeCenterY - 24 + index * 18}
          width={stripeBounds.width}
          height={12}
          fill={`var(${color})`}
        />
      ))}
      <text
        className="stroke-white dark:stroke-neutral-900"
        x={280}
        y={79}
        textAnchor="middle"
        fontFamily="Quicksand Variable, sans-serif"
        fontWeight={600}
        fontSize={72}
        letterSpacing={2}
        fill="var(--color-logo-text)"
        strokeWidth={12}
        paintOrder="stroke fill"
        strokeLinejoin="round"
      >
        Scorekeeper
      </text>
    </svg>
  );
}
