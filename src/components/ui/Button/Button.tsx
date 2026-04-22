import { type ButtonProps, Button as HeadlessButton } from "@headlessui/react";
import type { ElementType } from "react";
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
export function Button<TTag extends ElementType = "button">(props: ButtonProps<TTag>) {
  const incomingClassName = (props as Record<string, unknown>).className;
  const merged =
    typeof incomingClassName === "function"
      ? (...args: unknown[]) =>
          [baseClasses, (incomingClassName as (...a: unknown[]) => string)(...args)]
            .filter(Boolean)
            .join(" ")
      : [baseClasses, incomingClassName].filter(Boolean).join(" ");

  return <HeadlessButton {...(props as ButtonProps<"button">)} className={merged} />;
}
