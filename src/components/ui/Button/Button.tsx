import { type ButtonProps, Button as HeadlessButton } from "@headlessui/react";
import type { ElementType, ReactElement } from "react";
import { mergeClassName } from "../mergeClassName";
import { interactiveClasses } from "../sharedClasses";

const baseClasses = [
  "glass",
  "inline-flex items-center justify-center rounded-full relative",
  interactiveClasses,
  "hover:brightness-110 active:scale-110",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

/**
 * A frosted-glass button that wraps Headless UI's `Button`.
 *
 * Accepts the same props as `@headlessui/react`'s `Button` and layers on
 * the app's glass styling. Pass `as`, `children`, `className`, etc. just
 * like you would with the Headless UI component.
 */
export function Button<TTag extends ElementType = "button">(props: ButtonProps<TTag>): ReactElement;
export function Button(props: ButtonProps<"button">) {
  const merged = mergeClassName(baseClasses, props);
  return <HeadlessButton {...props} className={merged} />;
}
