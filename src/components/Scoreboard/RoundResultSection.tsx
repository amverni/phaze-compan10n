import { Check, ChevronDown, type LucideIcon, Minus, Redo, X } from "lucide-react";
import type { PhaseStatus } from "../../types";

interface RoundResultSectionProps {
  value: PhaseStatus | null;
  onChange: (next: PhaseStatus) => void;
  expanded: boolean;
  onToggleExpand: (next: boolean) => void;
  disabled?: boolean;
}

interface ResultOption {
  value: PhaseStatus;
  label: string;
  icon: LucideIcon;
}

const PRIMARY_OPTIONS: ResultOption[] = [
  { value: "failed", label: "Failed", icon: X },
  { value: "completed", label: "Passed", icon: Check },
];

const SECONDARY_OPTIONS: ResultOption[] = [
  { value: "skipped", label: "Skipped", icon: Redo },
  { value: "satOut", label: "Sat Out", icon: Minus },
];

const SELECTED_RESULT_CLASSES = {
  failed: "glass-result bg-pt-red-500! text-white",
  completed: "glass-result bg-pt-green-500! text-white",
  skipped: "glass-result bg-pt-yellow-500! text-neutral-900",
  satOut: "glass-result bg-pt-blue-500! text-white",
} satisfies Record<PhaseStatus, string>;

function resultButtonClasses(status: PhaseStatus, selected: boolean, disabled: boolean): string {
  return [
    "glass relative flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold",
    "transition-[filter,transform,opacity,background-color] duration-150 ease-out",
    "active:scale-95",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    selected
      ? SELECTED_RESULT_CLASSES[status]
      : "opacity-70 hover:brightness-110 hover:opacity-100",
    disabled ? "" : "cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");
}

interface ResultButtonProps {
  option: ResultOption;
  selected: boolean;
  disabled: boolean;
  onChange: (next: PhaseStatus) => void;
}

function ResultButton({ option, selected, disabled, onChange }: ResultButtonProps) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onChange(option.value)}
      className={resultButtonClasses(option.value, selected, disabled)}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{option.label}</span>
    </button>
  );
}

export function RoundResultSection({
  value,
  onChange,
  expanded,
  onToggleExpand,
  disabled = false,
}: RoundResultSectionProps) {
  return (
    <div className="flex w-full flex-col gap-2" role="radiogroup" aria-label="Round Result">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Round Result
        </p>
        <button
          type="button"
          aria-label={expanded ? "Hide extra options" : "Show extra options"}
          aria-expanded={expanded}
          onClick={() => onToggleExpand(!expanded)}
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
        >
          <ChevronDown
            className={["size-4 transition-transform duration-200", expanded ? "rotate-180" : ""]
              .filter(Boolean)
              .join(" ")}
            aria-hidden
          />
        </button>
      </div>

      <div className="flex w-full gap-2">
        {PRIMARY_OPTIONS.map((option) => (
          <ResultButton
            key={option.value}
            option={option}
            selected={value === option.value}
            disabled={disabled}
            onChange={onChange}
          />
        ))}
      </div>

      {expanded && (
        <div className="flex w-full gap-2">
          {SECONDARY_OPTIONS.map((option) => (
            <ResultButton
              key={option.value}
              option={option}
              selected={value === option.value}
              disabled={disabled}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
