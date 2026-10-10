import type { ListboxProps } from "@headlessui/react";
import type { ReactNode } from "react";
import { mergeClassName } from "../mergeClassName";
import { Listbox, ListboxButton, ListboxOptions } from "./Listbox";

type FilterListboxProps<TType, TActualType> = Omit<
  ListboxProps<"div", TType, TActualType>,
  "children"
> & {
  label: string;
  displayValue: string;
  children: ReactNode;
};

export function FilterListbox<TType = string, TActualType = TType extends (infer U)[] ? U : TType>({
  label,
  displayValue,
  children,
  ...props
}: FilterListboxProps<TType, TActualType>) {
  return (
    <Listbox<TType, TActualType> {...props} className={mergeClassName("min-w-0 max-w-full", props)}>
      <ListboxButton className="max-w-full">
        <span className="shrink-0 text-text-secondary">{label}:</span>
        <span className="truncate">{displayValue}</span>
      </ListboxButton>
      <ListboxOptions anchor="bottom start" className="listbox-viewport">
        {children}
      </ListboxOptions>
    </Listbox>
  );
}
