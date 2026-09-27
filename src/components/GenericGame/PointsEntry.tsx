import { Delete, Minus, Plus } from "lucide-react";
import { type KeyboardEvent, useId } from "react";
import { Button } from "../ui";

interface PointsEntryProps {
  name: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

const keyClasses = [
  "size-[clamp(3rem,16vw,4rem)] shrink-0 text-2xl font-semibold",
  "data-focus:outline-text-secondary!",
].join(" ");

export function PointsEntry({ name, value, error, disabled, onChange }: PointsEntryProps) {
  const id = useId();
  const toggleSign = () => onChange(value.startsWith("-") ? value.slice(1) : `-${value}`);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      onChange(value.slice(0, -1));
    } else if (event.key === "Delete") {
      event.preventDefault();
      onChange("");
    } else if (event.key === "-") {
      event.preventDefault();
      toggleSign();
    } else if (event.key === "+") {
      event.preventDefault();
      onChange(value.replace(/^-/, ""));
    } else if (event.key.length === 1 && event.key !== " ") {
      event.preventDefault();
      // Keep invalid typed characters visible so "1.5" cannot silently become "15".
      onChange(value + event.key);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-2 px-4 pt-4 pb-6">
      <Button
        type="button"
        aria-label={`${name} Points`}
        aria-invalid={!!error}
        aria-describedby={`${id}-value ${id}-help${error ? ` ${id}-error` : ""}`}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className={[
          "w-full min-w-0 flex-col gap-1 rounded-2xl! px-3 py-3",
          "ring-2 ring-text-secondary/60 data-focus:outline-text-secondary!",
        ].join(" ")}
      >
        <span className="text-sm">Points</span>
        <output
          id={`${id}-value`}
          aria-live="polite"
          className="max-w-full break-all text-2xl font-semibold tabular-nums"
        >
          {value || "Not entered"}
        </output>
      </Button>
      <p id={`${id}-help`} className="sr-only">
        Enter Points using the keypad or keyboard. Minus changes the sign. Backspace removes a
        digit. Delete clears the entry.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="w-full text-center text-sm text-pt-red-500">
          {error}
        </p>
      )}
      <fieldset className="grid grid-cols-3 justify-items-center gap-3 p-4">
        <legend className="sr-only">{name} Points keypad</legend>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <Button
            key={digit}
            type="button"
            disabled={disabled}
            onKeyDown={onKeyDown}
            onClick={() => onChange(value + digit)}
            className={keyClasses}
          >
            {digit}
          </Button>
        ))}
        <Button
          type="button"
          aria-label="Change sign"
          disabled={disabled}
          onKeyDown={onKeyDown}
          onClick={toggleSign}
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
          onClick={() => onChange(`${value}0`)}
          className={keyClasses}
        >
          0
        </Button>
        <Button
          type="button"
          aria-label="Backspace"
          disabled={disabled}
          onKeyDown={onKeyDown}
          onClick={() => onChange(value.slice(0, -1))}
          className={keyClasses}
        >
          <Delete className="size-6" aria-hidden />
        </Button>
      </fieldset>
    </div>
  );
}
