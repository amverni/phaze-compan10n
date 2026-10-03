import { Button as HeadlessButton } from "@headlessui/react";
import type { ComponentPropsWithRef } from "react";
import { mergeClassName } from "../mergeClassName";

const plainClasses = [
  "cursor-pointer",
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-text-secondary",
  "disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

/** A button without a surface or press scaling, for menu rows and fixed-size anchors. */
export function PlainButton({ className, ...props }: ComponentPropsWithRef<"button">) {
  return <HeadlessButton {...props} className={mergeClassName(plainClasses, { className })} />;
}
