import { ChevronDown, ChevronUp, Dices } from "lucide-react";
import { useState } from "react";
import { GlassSurface, GlassSurfaceButton } from "../../ui";

const DEFAULT_RANDOM_COUNT = 10;

const randomPillClasses = [
  "relative inline-flex h-10 shrink-0 items-stretch overflow-hidden rounded-full",
  "has-[.random-phases-action:hover]:brightness-110 has-[.random-phases-action:active]:scale-110",
].join(" ");

const randomActionClasses = [
  "h-10 rounded-l-full rounded-r-none gap-1.5 pl-3 pr-0 text-sm font-semibold tabular-nums",
  "random-phases-action",
].join(" ");

const randomStepperClasses = [
  "relative grid h-10 w-8 shrink-0 grid-rows-2 overflow-hidden rounded-full",
].join(" ");

const randomArrowClasses = [
  "h-5 w-8 rounded-none p-0",
  "before:absolute before:inset-0 before:bg-black/5 before:opacity-0 before:transition-opacity before:content-['']",
  "hover:bg-transparent hover:brightness-100 hover:before:opacity-100 active:scale-100 dark:before:bg-white/10",
  "disabled:opacity-30",
].join(" ");

const randomUpArrowClasses = [randomArrowClasses, "before:rounded-t-full"].join(" ");

const randomDownArrowClasses = [randomArrowClasses, "before:rounded-b-full"].join(" ");

interface RandomPhasesButtonProps {
  onRandom: (count: number) => void;
}

export function RandomPhasesButton({ onRandom }: RandomPhasesButtonProps) {
  const [count, setCount] = useState(DEFAULT_RANDOM_COUNT);

  function incrementCount() {
    setCount((current) => current + 1);
  }

  function decrementCount() {
    setCount((current) => Math.max(1, current - 1));
  }

  return (
    <GlassSurface className={randomPillClasses} role="group" aria-label="Random phase count picker">
      <GlassSurfaceButton
        type="button"
        className={randomActionClasses}
        onClick={() => onRandom(count)}
        aria-label={`Pick ${count} random phases`}
        title={`Pick ${count} random phases`}
      >
        <Dices className="size-4" />
        <span className="min-w-4 text-center">{count}</span>
      </GlassSurfaceButton>
      <div className={randomStepperClasses}>
        <GlassSurfaceButton
          type="button"
          className={randomUpArrowClasses}
          onClick={incrementCount}
          aria-label="Increase random phase count"
          title="Increase random phase count"
        >
          <ChevronUp className="relative z-10 size-3.5" />
        </GlassSurfaceButton>
        <GlassSurfaceButton
          type="button"
          className={randomDownArrowClasses}
          onClick={decrementCount}
          disabled={count === 1}
          aria-label="Decrease random phase count"
          title="Decrease random phase count"
        >
          <ChevronDown className="relative z-10 size-3.5" />
        </GlassSurfaceButton>
      </div>
    </GlassSurface>
  );
}
