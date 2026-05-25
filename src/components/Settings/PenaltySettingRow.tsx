import { GAME_PENALTY_RANGE } from "../../data/constants/gameSettings";
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  SettingListRow,
} from "../ui";

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
    <Listbox value={value} onChange={onChange} disabled={disabled} className="w-full min-w-0">
      <SettingListRow label={<ListboxLabel>{label}</ListboxLabel>}>
        <ListboxButton variant="plain" className="shrink-0">
          {value} pts
        </ListboxButton>
        <ListboxOptions align="right" transformOrigin="top-right">
          {PENALTY_OPTIONS.map((option) => (
            <ListboxOption key={option} value={option}>
              {option} pts
            </ListboxOption>
          ))}
        </ListboxOptions>
      </SettingListRow>
    </Listbox>
  );
}
