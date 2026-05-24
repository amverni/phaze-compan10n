import { GAME_PENALTY_RANGE } from "../../data/constants/gameSettings";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "../ui";
import { SettingListRow } from "./SettingListRow";

const PENALTY_OPTIONS: number[] = Array.from(
  {
    length:
      Math.floor((GAME_PENALTY_RANGE.max - GAME_PENALTY_RANGE.min) / GAME_PENALTY_RANGE.step) + 1,
  },
  (_, i) => GAME_PENALTY_RANGE.min + i * GAME_PENALTY_RANGE.step,
);

interface PenaltySettingRowProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

export function PenaltySettingRow({
  label,
  value,
  onChange,
  disabled = false,
}: PenaltySettingRowProps) {
  return (
    <SettingListRow label={label}>
      {(labelId) => (
        <Listbox value={value} onChange={onChange} disabled={disabled} aria-labelledby={labelId}>
          <ListboxButton variant="plain" className="shrink-0">
            {value} pts
          </ListboxButton>
          <ListboxOptions className="right-0 left-auto origin-top-right">
            {PENALTY_OPTIONS.map((option) => (
              <ListboxOption key={option} value={option}>
                {option} pts
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Listbox>
      )}
    </SettingListRow>
  );
}
