import { TIEBREAKER_LABELS, TIEBREAKER_OPTIONS } from "../../data/constants/gameSettings";
import type { GameTiebreaker } from "../../types";
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  SettingListRow,
} from "../ui";

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
    <Listbox value={value} onChange={onChange} disabled={disabled} className="w-full min-w-0">
      <SettingListRow label={<ListboxLabel>{label}</ListboxLabel>}>
        <ListboxButton variant="plain" className="shrink-0">
          {TIEBREAKER_LABELS[value]}
        </ListboxButton>
        <ListboxOptions
          align="right"
          anchor={{ to: "bottom end", gap: "0.25rem", padding: "1rem" }}
          transformOrigin="top-right"
        >
          {TIEBREAKER_OPTIONS.map(({ value, label }) => (
            <ListboxOption key={value} value={value}>
              {label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </SettingListRow>
    </Listbox>
  );
}
