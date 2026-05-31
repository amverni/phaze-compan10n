import { ChevronDown } from "lucide-react";
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
}

const PRIMARY_OPTIONS: ResultOption[] = [
  { value: "failed", label: "Failed" },
  { value: "completed", label: "Passed" },
];

const SECONDARY_OPTIONS: ResultOption[] = [
  { value: "skipped", label: "Skipped" },
  { value: "satOut", label: "Sat Out" },
];

const SELECTED_RESULT_CLASSES = {
  failed: "bg-pt-red-500 text-white shadow-sm",
  completed: "bg-pt-green-500 text-white shadow-sm",
  skipped: "bg-pt-yellow-500 text-neutral-900 shadow-sm",
  satOut: "bg-pt-blue-500 text-white shadow-sm",
} satisfies Record<PhaseStatus, string>;

function resultButtonClasses(status: PhaseStatus, selected: boolean, disabled: boolean): string {
  return [
    "relative flex-1 rounded-full px-3 py-2 text-sm font-semibold",
    "transition-[filter,transform,opacity,background-color] duration-150 ease-out",
    "active:scale-95",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    selected
      ? SELECTED_RESULT_CLASSES[status]
      : "glass opacity-70 hover:brightness-110 hover:opacity-100",
    disabled ? "" : "cursor-pointer",
  ]
    .filter(Boolean)
    .join(" ");
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
        {PRIMARY_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={resultButtonClasses(option.value, selected, disabled)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {expanded && (
        <div className="flex w-full gap-2">
          {SECONDARY_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => onChange(option.value)}
                className={resultButtonClasses(option.value, selected, disabled)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
