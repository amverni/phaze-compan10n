import { Label, Radio, RadioGroup } from "@headlessui/react";
import type { GenericScoreDirection } from "../../types";
import { SettingListRow } from "../ui";

interface ScoreDirectionSettingProps {
  label: string;
  value: GenericScoreDirection;
  onChange: (value: GenericScoreDirection) => void;
  onBlur: () => void;
}

const directions = [
  { value: "high", label: "High wins" },
  { value: "low", label: "Low wins" },
] as const;
const directionClasses = [
  "relative cursor-pointer rounded-full px-3 py-2 text-sm outline-none",
  "data-checked:bg-text-secondary/15 data-checked:font-semibold",
  "data-focus:outline-2 data-focus:outline-text-secondary",
].join(" ");

export function ScoreDirectionSetting({
  label,
  value,
  onChange,
  onBlur,
}: ScoreDirectionSettingProps) {
  return (
    <RadioGroup value={value} onChange={onChange} onBlur={onBlur} className="w-full">
      <SettingListRow label={<Label>{label}</Label>}>
        <div className="glass relative flex shrink-0 rounded-full p-1">
          {directions.map((direction) => (
            <Radio key={direction.value} value={direction.value} className={directionClasses}>
              {direction.label}
            </Radio>
          ))}
        </div>
      </SettingListRow>
    </RadioGroup>
  );
}
