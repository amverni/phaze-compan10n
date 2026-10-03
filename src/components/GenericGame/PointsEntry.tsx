import { Delete, Minus, Plus } from "lucide-react";
import { type KeyboardEvent, useId, useState } from "react";
import { editGenericPoints } from "../../utils/genericPoints";
import { Button } from "../ui";

interface NumericField {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

interface PointsEntryProps {
  name: string;
  points: NumericField;
  tiebreaker?: NumericField;
  disabled: boolean;
}

const keyClasses = [
  "size-[clamp(3rem,16vw,4rem)] shrink-0 text-2xl font-semibold",
  "data-focus:outline-text-secondary!",
].join(" ");

export function PointsEntry({ name, points, tiebreaker, disabled }: PointsEntryProps) {
  const id = useId();
  const [selectedMetric, setSelectedMetric] = useState<"Points" | "Tiebreaker">("Points");
  const metric = tiebreaker ? selectedMetric : "Points";
  const { value, onChange } = metric === "Tiebreaker" && tiebreaker ? tiebreaker : points;
  const fields = [
    { label: "Points" as const, ...points },
    ...(tiebreaker ? [{ label: "Tiebreaker" as const, ...tiebreaker }] : []),
  ];
  const edit = (key: string) => onChange(editGenericPoints(value, key));
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    if (
      event.key === "Backspace" ||
      event.key === "Delete" ||
      (event.key.length === 1 && event.key !== " ")
    ) {
      event.preventDefault();
      edit(event.key);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 px-4 pt-4 pb-6">
      <div className={["grid w-full gap-3", tiebreaker ? "grid-cols-2" : "grid-cols-1"].join(" ")}>
        {fields.map((field) => {
          const content = (
            <>
              <span className="text-sm">{field.label}</span>
              <output
                id={`${id}-${field.label}-value`}
                aria-label={`${name} ${field.label}`}
                aria-invalid={!!field.error}
                aria-describedby={field.error ? `${id}-${field.label}-error` : undefined}
                aria-live="polite"
                className="max-w-full break-all text-2xl font-semibold tabular-nums"
              >
                {field.value}
              </output>
            </>
          );
          const boxClasses = "w-full min-w-0 flex-col gap-1 rounded-2xl! px-3 py-3";
          return (
            <div key={field.label} className="min-w-0">
              {tiebreaker ? (
                <Button
                  type="button"
                  aria-label={`${name} ${field.label}`}
                  aria-pressed={metric === field.label}
                  aria-invalid={!!field.error}
                  aria-describedby={`${id}-${field.label}-value ${id}-help${field.error ? ` ${id}-${field.label}-error` : ""}`}
                  disabled={disabled}
                  onFocus={() => setSelectedMetric(field.label)}
                  onClick={(event) => {
                    setSelectedMetric(field.label);
                    event.currentTarget.focus();
                  }}
                  onKeyDown={onKeyDown}
                  className={[
                    boxClasses,
                    "data-focus:outline-text-secondary!",
                    metric === field.label ? "border-text-secondary!" : "",
                  ].join(" ")}
                >
                  {content}
                </Button>
              ) : (
                <div className={["glass flex items-center", boxClasses].join(" ")}>{content}</div>
              )}
              {field.error && (
                <p
                  id={`${id}-${field.label}-error`}
                  role="alert"
                  className="pt-2 text-center text-sm text-pt-red-500"
                >
                  {field.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p id={`${id}-help`} className="sr-only">
        Enter {metric} using the keypad or keyboard. Minus changes the sign. Backspace removes a
        digit. Delete resets to zero.
        {tiebreaker && " Select a field to change the keypad target."}
      </p>
      <fieldset
        aria-describedby={`${id}-${metric}-value ${id}-help`}
        className="grid grid-cols-3 justify-items-center gap-3 p-4"
      >
        <legend className="sr-only">
          {name} {metric} keypad
        </legend>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <Button
            key={digit}
            type="button"
            disabled={disabled}
            onKeyDown={onKeyDown}
            onClick={() => edit(digit)}
            className={keyClasses}
          >
            {digit}
          </Button>
        ))}
        <Button
          type="button"
          aria-label="Change sign"
          disabled={disabled || value === "0"}
          onKeyDown={onKeyDown}
          onClick={() => edit("-")}
          className={keyClasses}
        >
          <span className="flex flex-col items-center" aria-hidden>
            <Plus className="size-4" />
            <Minus className="h-2 w-4" />
          </span>
        </Button>
        <Button
          type="button"
          disabled={disabled}
          onKeyDown={onKeyDown}
          onClick={() => edit("0")}
          className={keyClasses}
        >
          0
        </Button>
        <Button
          type="button"
          aria-label="Backspace"
          disabled={disabled || value === "0"}
          onKeyDown={onKeyDown}
          onClick={() => edit("Backspace")}
          className={keyClasses}
        >
          <Delete className="size-6" aria-hidden />
        </Button>
      </fieldset>
    </div>
  );
}
