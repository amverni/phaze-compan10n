import { TIEBREAKER_LABELS, TIEBREAKER_OPTIONS } from "../../../data/constants/gameSettings";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "../../ui";
import { useGameSettings, useSetTiebreaker } from "../CreateGameContext";

export function TiebreakerSetting() {
  const { tiebreaker } = useGameSettings();
  const setTiebreaker = useSetTiebreaker();

  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3">
      <span className="font-medium">Tiebreaker</span>
      <Listbox value={tiebreaker} onChange={setTiebreaker}>
        <ListboxButton variant="plain" className="shrink-0">
          {TIEBREAKER_LABELS[tiebreaker]}
        </ListboxButton>
        <ListboxOptions className="right-0 left-auto">
          {TIEBREAKER_OPTIONS.map(({ value, label }) => (
            <ListboxOption key={value} value={value}>
              {label}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </div>
  );
}
