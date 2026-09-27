interface ScorekeeperLogoProps {
  height: number;
}

const stripes = [
  "--color-scorekeeper-gold",
  "--color-scorekeeper-silver",
  "--color-scorekeeper-bronze",
];

export function ScorekeeperLogo({ height }: ScorekeeperLogoProps) {
  return (
    <svg
      className="block w-full max-w-xl max-h-full shrink-0"
      viewBox="0 0 560 112"
      height={height}
      role="img"
    >
      <title>Scorekeeper</title>
      {stripes.map((color, index) => (
        <rect
          key={color}
          x={0}
          y={30 + index * 18}
          width={560}
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
