import { Input as HeadlessInput, type InputProps } from "@headlessui/react";
import type { ElementType, ReactElement, Ref } from "react";
import { mergeClassName } from "../mergeClassName";

const baseClasses = [
  "w-full bg-transparent text-sm outline-none",
  "placeholder:text-text-secondary/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

/**
 * A styled text input that wraps Headless UI's `Input`.
 *
 * Provides consistent base styling (transparent background, placeholder color,
 * disabled states). Use with `glass` + layout classes for form fields.
 * For search bars, use `SearchBar` instead.
 */
export function Input<TTag extends ElementType = "input">(
  props: InputProps<TTag> & { ref?: Ref<HTMLInputElement> },
): ReactElement;
export function Input({ ref, ...props }: InputProps<"input"> & { ref?: Ref<HTMLInputElement> }) {
  const merged = mergeClassName(baseClasses, props);
  return <HeadlessInput ref={ref} {...props} className={merged} />;
}
