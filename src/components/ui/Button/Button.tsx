import { type ButtonProps, Button as HeadlessButton } from "@headlessui/react";
import type { ElementType } from "react";

const baseClasses = [
  "glass",
  "inline-flex items-center justify-center rounded-full relative",
  "cursor-pointer transition-all duration-150",
  "hover:brightness-110 active:scale-110",
  "focus:outline-none data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-white/60",
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
