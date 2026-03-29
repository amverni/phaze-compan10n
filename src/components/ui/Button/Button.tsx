import { Button as HeadlessButton } from "@headlessui/react";
import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type React from "react";

type ButtonSize = "small" | "regular";

type BaseProps = {
  /** Accessible label for the button. */
  "aria-label": string;
  /** Lucide icon component to render inside the button. */
  icon: LucideIcon;
  /** Extra classes merged onto the outer element. */
  className?: string;
  /** Button size. Defaults to "regular". */
  size?: ButtonSize;
};

type ButtonProps = BaseProps & {
  as?: "button";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  to?: never;
};

type LinkProps = BaseProps & {
  as: "link";
  to: string;
  onClick?: never;
};

type Props = ButtonProps | LinkProps;

const sizeClasses: Record<ButtonSize, string> = {
  small: "size-10",
  regular: "size-14",
};

const iconSizeClasses: Record<ButtonSize, string> = {
  small: "size-6",
  regular: "size-8",
};

const baseClasses = [
  "liquid-glass",
  "inline-flex items-center justify-center rounded-full relative",
  "cursor-pointer transition-all duration-150",
  "hover:brightness-110 active:scale-95",
  "focus:outline-none data-[focus]:outline-2 data-[focus]:outline-offset-2 data-[focus]:outline-white/60",
].join(" ");

/**
 * A circular, frosted-glass button inspired by iOS liquid glass.
 *
 * Uses Headless UI's `Button` for keyboard / focus management.
 * Renders as a `<button>` by default. Pass `as="link"` with a `to` prop to
 * render as a TanStack Router `<Link>` instead.
 */
export function Button(props: Props) {
  const { icon: Icon, className, "aria-label": ariaLabel, size = "regular", ...rest } = props;
  const classes = [baseClasses, sizeClasses[size], className].filter(Boolean).join(" ");

  if (props.as === "link") {
    return (
      <HeadlessButton as={Link} to={props.to} className={classes} aria-label={ariaLabel}>
        <Icon className={`${iconSizeClasses[size]} relative z-10`} />
      </HeadlessButton>
    );
  }

  return (
    <HeadlessButton
      className={classes}
      aria-label={ariaLabel}
      onClick={(rest as ButtonProps).onClick}
    >
      <Icon className={`${iconSizeClasses[size]} relative z-10`} />
    </HeadlessButton>
  );
}
