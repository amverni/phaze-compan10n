import { useId } from "react";
import type { GameTiebreaker, PhaseStatus } from "../../types";
import { interactiveClasses } from "../ui/sharedClasses";
import { WheelSelector } from "../ui/WheelSelector/WheelSelector";
import type { PointsQuickButtonId, QuickCounts } from "./addRoundDraft";
import "./TiebreakerEntrySection.css";

interface TiebreakerEntrySectionProps {
  tiebreaker: GameTiebreaker;
  value: number;
  onChange: (next: number) => void;
  onQuickIncrement: (button: PointsQuickButtonId) => void;
  quickCounts: QuickCounts;
  /** Current round result. Skipped / Sat Out disable the section. Null = not yet picked. */
  result: PhaseStatus | null;
}

type QuickButtonAccent = "blue" | "green" | "yellow" | "red";

interface PointsQuickButton {
  id: PointsQuickButtonId;
  label: string;
  delta: number;
  accent: QuickButtonAccent;
  counterClassName: string;
}

const POINTS_QUICK_BUTTONS: PointsQuickButton[] = [
  { id: "p5", label: "+5", delta: 5, accent: "blue", counterClassName: "text-pt-blue-500" },
  { id: "p10", label: "+10", delta: 10, accent: "green", counterClassName: "text-pt-green-500" },
  {
    id: "skipCard",
    label: "Skip",
    delta: 15,
    accent: "yellow",
    counterClassName: "text-pt-yellow-500",
  },
  { id: "wild", label: "Wild", delta: 25, accent: "red", counterClassName: "text-pt-red-500" },
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

const quickButtonRowClasses = [
  "-mx-1 flex min-w-0 flex-nowrap gap-1.5 overflow-x-auto px-1 py-1",
].join(" ");

const quickCardButtonBaseClasses = [
  "glass tiebreaker-quick-card relative inline-flex h-14 min-w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-bold leading-none",
  interactiveClasses,
  "transition-[filter,transform,opacity,background-color] duration-150 ease-out",
  "hover:brightness-110 active:scale-95",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");

const quickCardAccentClasses: Record<QuickButtonAccent | "neutral", string> = {
  blue: "tiebreaker-quick-card--blue",
  green: "tiebreaker-quick-card--green",
  yellow: "tiebreaker-quick-card--yellow",
  red: "tiebreaker-quick-card--red",
  neutral: "",
};

function getQuickCardButtonClasses({
  accent,
  selected = false,
}: {
  accent: QuickButtonAccent | "neutral";
  selected?: boolean;
}): string {
  return [
    quickCardButtonBaseClasses,
    quickCardAccentClasses[accent],
    selected
      ? "tiebreaker-quick-card--selected bg-white/15! ring-1 ring-pt-blue-500/50 dark:bg-white/10!"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getCounterDescription(count: number): string {
  return `Used ${count} ${count === 1 ? "time" : "times"}`;
}

function QuickCardCaps() {
  return (
    <>
      <span aria-hidden className="tiebreaker-quick-card__cap tiebreaker-quick-card__cap--top" />
      <span aria-hidden className="tiebreaker-quick-card__cap tiebreaker-quick-card__cap--bottom" />
    </>
  );
}

export function TiebreakerEntrySection({
  tiebreaker,
  value,
  onChange,
  onQuickIncrement,
  quickCounts,
  result,
}: TiebreakerEntrySectionProps) {
  const variant = resolveVariant(tiebreaker);
  const counterIdBase = useId();
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
        <div className="flex w-full items-start justify-between gap-2">
          <div className={quickButtonRowClasses}>
            {POINTS_QUICK_BUTTONS.map((btn) => {
              const count = quickCounts[btn.id];
              const counterId = `${counterIdBase}-${btn.id}`;
              return (
                <div key={btn.id} className="flex shrink-0 flex-col items-center gap-1">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onQuickIncrement(btn.id)}
                    className={getQuickCardButtonClasses({ accent: btn.accent })}
                    aria-label={`Add ${btn.delta} points (${btn.label})`}
                    aria-describedby={counterId}
                  >
                    <QuickCardCaps />
                    <span className="relative z-10 text-text-primary">{btn.label}</span>
                  </button>
                  <span
                    id={counterId}
                    className={[
                      "text-xs font-bold leading-none tabular-nums",
                      count > 0 ? btn.counterClassName : "text-text-secondary opacity-60",
                    ].join(" ")}
                  >
                    <span aria-hidden>{count}</span>
                    <span className="sr-only">{getCounterDescription(count)}</span>
                  </span>
                </div>
              );
            })}
          </div>
          <div className="shrink-0 -mt-2">
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
        </div>
      )}

      {variant.kind === "count" && (
        <div className="flex w-full items-start justify-between gap-2">
          <div className={quickButtonRowClasses}>
            {COUNT_QUICK_BUTTONS.map((n) => {
              const selected = value === n;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  onClick={() => onQuickSet(n)}
                  className={getQuickCardButtonClasses({
                    accent: selected ? "blue" : "neutral",
                    selected,
                  })}
                  aria-label={`Set to ${n}`}
                  aria-pressed={selected}
                >
                  <QuickCardCaps />
                  <span className="relative z-10 text-text-primary">{n}</span>
                </button>
              );
            })}
          </div>
          <div className="shrink-0 -mt-2">
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
        </div>
      )}
    </div>
  );
}
