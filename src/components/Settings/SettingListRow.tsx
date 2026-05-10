import { type ReactNode, useId } from "react";

interface SettingListRowProps {
  label: string;
  children: ReactNode | ((labelId: string) => ReactNode);
}

export function SettingListRow({ label, children }: SettingListRowProps) {
  const labelId = useId();

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <span id={labelId} className="min-w-0 font-medium">
        {label}
      </span>
      {typeof children === "function" ? children(labelId) : children}
    </div>
  );
}
