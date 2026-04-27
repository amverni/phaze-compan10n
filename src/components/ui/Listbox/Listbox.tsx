import {
  Listbox as HeadlessListbox,
  ListboxButton as HeadlessListboxButton,
  ListboxOption as HeadlessListboxOption,
  ListboxOptions as HeadlessListboxOptions,
  type ListboxProps,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { interactiveClasses } from "../sharedClasses";
import "./Listbox.css";

/* ── Root ──────────────────────────────────────────────────── */

export function Listbox<TType = string, TActualType = TType extends (infer U)[] ? U : TType>(
  props: ListboxProps<"div", TType, TActualType>,
) {
  return (
    <div className="relative">
      <HeadlessListbox {...props} />
    </div>
  );
}

/* ── Trigger ───────────────────────────────────────────────── */

const buttonClasses = [
  "glass relative overflow-hidden",
  "inline-flex items-center justify-between gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium",
  "min-w-[6rem]",
  interactiveClasses,
  "hover:brightness-110",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
].join(" ");

export function ListboxButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const merged = [buttonClasses, className].filter(Boolean).join(" ");
  const contentRef = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState<number | undefined>();

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.borderBoxSize[0].inlineSize);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <HeadlessListboxButton
      className={merged}
      style={width !== undefined ? { width: width + 44 } : undefined}
    >
      <span ref={contentRef} className="inline-flex items-center gap-1.5">
        {children}
      </span>
      <span className="inline-flex shrink-0 transition-transform duration-300 ease-linear [[data-open]>&]:rotate-180">
        <ChevronDown className="size-3.5 text-text-secondary" aria-hidden />
      </span>
    </HeadlessListboxButton>
  );
}

/* ── Options panel ─────────────────────────────────────────── */

const panelClasses = [
  "glass listbox-glass rounded-xl shadow-xl",
  "absolute left-0 top-full z-50 mt-1 w-max",
  "p-1",
  "focus:outline-none",
  "transition duration-200 ease-out data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150",
].join(" ");

export function ListboxOptions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const merged = [panelClasses, className].filter(Boolean).join(" ");
  return (
    <HeadlessListboxOptions transition className={merged}>
      {children}
    </HeadlessListboxOptions>
  );
}

/* ── Option ────────────────────────────────────────────────── */

const optionClasses = [
  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
  "cursor-pointer select-none transition-colors duration-100",
  "data-[focus]:bg-white/20 dark:data-[focus]:bg-white/10",
].join(" ");

export function ListboxOption<TValue>({
  children,
  value,
  className,
  selected: selectedOverride,
}: {
  children: ReactNode;
  value: TValue;
  className?: string;
  selected?: boolean;
}) {
  const merged = [optionClasses, className].filter(Boolean).join(" ");
  return (
    <HeadlessListboxOption value={value} className={merged}>
      {({ selected: headlessSelected }) => {
        const isSelected = selectedOverride ?? headlessSelected;
        return (
          <>
            <Check
              className={["size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0"].join(" ")}
              aria-hidden
            />
            {children}
          </>
        );
      }}
    </HeadlessListboxOption>
  );
}
