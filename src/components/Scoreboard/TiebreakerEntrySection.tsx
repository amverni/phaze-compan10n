import type { GameTiebreaker, PhaseStatus } from "../../types";
import { WheelSelector } from "../ui/WheelSelector/WheelSelector";
import type { PointsQuickButtonId, QuickCounts } from "./addRoundDraft";

interface TiebreakerEntrySectionProps {
  tiebreaker: GameTiebreaker;
  value: number;
  onChange: (next: number) => void;
  onQuickIncrement: (button: PointsQuickButtonId) => void;
  quickCounts: QuickCounts;
  /** Current round result. Skipped / Sat Out disable the section. Null = not yet picked. */
  result: PhaseStatus | null;
}

interface PointsQuickButton {
  id: PointsQuickButtonId;
  label: string;
  delta: number;
}

const POINTS_QUICK_BUTTONS: PointsQuickButton[] = [
  { id: "p5", label: "+5", delta: 5 },
  { id: "p10", label: "+10", delta: 10 },
  { id: "skipCard", label: "Skip", delta: 15 },
  { id: "wild", label: "Wild", delta: 25 },
];

const COUNT_QUICK_BUTTONS: number[] = [1, 2, 3, 4, 5];

interface VariantConfig {
  kind: "points" | "count" | "hidden";
  label: string;
  min: number;
  max: number;
  step: number;
}

function resolveVariant(tiebreaker: GameTiebreaker): VariantConfig {
  switch (tiebreaker) {
    case "lowestPoints":
    case "highestPoints":
      return { kind: "points", label: "Points", min: 0, max: 250, step: 5 };
    case "fewestWilds":
      return { kind: "count", label: "Wilds used", min: 0, max: 25, step: 1 };
    case "fewestSkips":
      return {
        kind: "count",
        label: "Skip cards played",
        min: 0,
        max: 25,
        step: 1,
      };
    case "mostSkipped":
      return {
        kind: "count",
        label: "Times skipped",
        min: 0,
        max: 25,
        step: 1,
      };
    case "roundsWon":
      return { kind: "hidden", label: "", min: 0, max: 0, step: 1 };
  }
}

function clampToMax(value: number, max: number): number {
  return Math.min(max, value);
}

const quickButtonBaseClasses = [
  "glass inline-flex h-11 w-11 flex-col items-center justify-center rounded-full text-sm font-semibold leading-none",
  "transition-[filter,transform] duration-150 ease-out",
  "hover:brightness-110 active:scale-95",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "cursor-pointer",
].join(" ");

const countButtonClasses = [
  "glass inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold",
  "transition-[filter,transform] duration-150 ease-out",
  "hover:brightness-110 active:scale-95",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "cursor-pointer",
].join(" ");

export function TiebreakerEntrySection({
  tiebreaker,
  value,
  onChange,
  onQuickIncrement,
  quickCounts,
  result,
}: TiebreakerEntrySectionProps) {
  const variant = resolveVariant(tiebreaker);
  if (variant.kind === "hidden") {
    return null;
  }

  const disabled = result === "skipped" || result === "satOut";

  const onQuickSet = (next: number) => {
    if (disabled) return;
    onChange(clampToMax(next, variant.max));
  };

  return (
    <div
      className={["flex w-full flex-col gap-2", disabled ? "opacity-50" : ""]
        .filter(Boolean)
        .join(" ")}
      aria-disabled={disabled || undefined}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
        {variant.label}
      </p>

      {variant.kind === "points" && (
        <div className="flex w-full items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-2">
            {POINTS_QUICK_BUTTONS.map((btn) => {
              const count = quickCounts[btn.id];
              return (
                <button
                  key={btn.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onQuickIncrement(btn.id)}
                  className={quickButtonBaseClasses}
                  aria-label={`Add ${btn.delta} points (${btn.label})`}
                >
                  <span>{btn.label}</span>
                  <span
                    className={[
                      "mt-0.5 text-[0.625rem] font-bold leading-none tabular-nums",
                      count > 0 ? "text-pt-blue-500" : "text-text-secondary opacity-60",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <WheelSelector
            value={value}
            onChange={onChange}
            min={variant.min}
            max={variant.max}
            step={variant.step}
            label={variant.label}
            disabled={disabled}
          />
        </div>
      )}

      {variant.kind === "count" && (
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {COUNT_QUICK_BUTTONS.map((n) => (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onQuickSet(n)}
                className={countButtonClasses}
                aria-label={`Set to ${n}`}
                aria-pressed={value === n}
              >
                {n}
              </button>
            ))}
          </div>
          <WheelSelector
            value={value}
            onChange={onChange}
            min={variant.min}
            max={variant.max}
            step={variant.step}
            label={variant.label}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
