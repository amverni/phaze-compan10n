import { TIEBREAKER_LABELS, TIEBREAKER_OPTIONS } from "../../data/constants/gameSettings";
import type { GameTiebreaker } from "../../types";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "../ui";
import { SettingListRow } from "./SettingListRow";

interface TiebreakerSettingRowProps {
  label: string;
  value: GameTiebreaker;
  onChange: (tiebreaker: GameTiebreaker) => void;
  disabled?: boolean;
}

export function TiebreakerSettingRow({
  label,
  value,
  onChange,
  disabled = false,
}: TiebreakerSettingRowProps) {
  return (
    <SettingListRow label={label}>
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <ListboxButton variant="plain" className="shrink-0">
          {TIEBREAKER_LABELS[value]}
        </ListboxButton>
        <ListboxOptions className="right-0 left-auto origin-top-right">
          {TIEBREAKER_OPTIONS.map(({ value, label }) => (
            <ListboxOption key={value} value={value}>
              {label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </SettingListRow>
  );
}
