import { Switch as HeadlessSwitch, type SwitchProps } from "@headlessui/react";
import type { ElementType, ReactElement } from "react";
import { mergeClassName } from "../mergeClassName";

const baseClasses = [
  "group",
  "relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full",
  "bg-black/25 dark:bg-white/30 shadow-inner",
  "cursor-pointer transition-colors duration-300 ease-in-out",
  "data-[checked]:bg-[#34C759]",
  "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
  "focus:outline-none data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-white/60",
].join(" ");

const knobClasses = [
  "pointer-events-none inline-block size-[18px] rounded-full",
  "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
  "transition-transform duration-300 ease-in-out",
  "translate-x-[2px] group-data-[checked]:translate-x-[18px]",
].join(" ");

/**
 * A sliding toggle switch that wraps Headless UI's `Switch`.
 *
 * Uses `role="switch"` for correct screen-reader semantics.
 * Accepts the same props as `@headlessui/react`'s `Switch`.
 */
export function Switch<TTag extends ElementType = "button">(props: SwitchProps<TTag>): ReactElement;
export function Switch(props: SwitchProps<"button">) {
  const merged = mergeClassName(baseClasses, props);

  return (
    <HeadlessSwitch {...props} className={merged}>
      <span aria-hidden="true" className={knobClasses} />
    </HeadlessSwitch>
  );
}
