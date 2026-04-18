import {
  Popover as HeadlessPopover,
  PopoverButton as HeadlessPopoverButton,
  PopoverPanel as HeadlessPopoverPanel,
  type PopoverButtonProps,
  type PopoverPanelProps,
  type PopoverProps,
} from "@headlessui/react";
import type { ElementType, ReactNode } from "react";
import "./Popover.css";

/* ── Root ──────────────────────────────────────────────────── */

export function Popover<TTag extends ElementType = "div">(props: PopoverProps<TTag>) {
  return <HeadlessPopover {...(props as PopoverProps<"div">)} />;
}

/* ── Trigger ───────────────────────────────────────────────── */

export function PopoverButton<TTag extends ElementType = "button">(
  props: PopoverButtonProps<TTag>,
) {
  return <HeadlessPopoverButton {...(props as PopoverButtonProps<"button">)} />;
}

/* ── Panel ─────────────────────────────────────────────────── */

const panelClasses = "glass popover-glass rounded-2xl shadow-xl focus:outline-none overflow-hidden";

const transitionClasses =
  "transition duration-200 ease-out data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150";

export function PopoverPanel<TTag extends ElementType = "div">(
  props: PopoverPanelProps<TTag> & { children?: ReactNode },
) {
  const { children, className, ...rest } = props as PopoverPanelProps<"div"> & {
    children?: ReactNode;
  };
  const merged = [panelClasses, transitionClasses, className].filter(Boolean).join(" ");

  return (
    <HeadlessPopoverPanel transition {...(rest as PopoverPanelProps<"div">)} className={merged}>
      {children}
    </HeadlessPopoverPanel>
  );
}
