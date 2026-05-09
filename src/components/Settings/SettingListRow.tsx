import type { ReactNode } from "react";

interface SettingListRowProps {
  label: string;
  children: ReactNode;
}

export function SettingListRow({ label, children }: SettingListRowProps) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 font-medium">{label}</span>
      {children}
    </div>
  );
}
