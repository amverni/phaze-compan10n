import { useQuery } from "@tanstack/react-query";
import { phaseSetListOptions } from "../../data/hooks/usePhaseSets";
import { useSetDefaultPhaseSetId } from "../../data/hooks/useSettings";
import type { PhaseSetId } from "../../types";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "../ui";
import { SettingListRow } from "./SettingListRow";

interface DefaultPhaseSetSettingProps {
  value: PhaseSetId;
}

export function DefaultPhaseSetSetting({ value }: DefaultPhaseSetSettingProps) {
  const { data: phaseSets = [], isLoading } = useQuery(phaseSetListOptions());
  const setDefaultPhaseSetId = useSetDefaultPhaseSetId();
  const selectedPhaseSet = phaseSets.find((phaseSet) => phaseSet.id === value);
  const selectedLabel = selectedPhaseSet?.name ?? (isLoading ? "Loading..." : value);

  return (
    <SettingListRow label="Default Phase Set">
      <Listbox
        value={value}
        onChange={(phaseSetId) => setDefaultPhaseSetId.mutate(phaseSetId)}
        disabled={isLoading || setDefaultPhaseSetId.isPending}
      >
        <ListboxButton variant="plain" className="shrink-0">
          {selectedLabel}
        </ListboxButton>
        <ListboxOptions className="right-0 left-auto origin-top-right">
          {phaseSets.map(({ id, name }) => (
            <ListboxOption key={id} value={id}>
              {name}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </SettingListRow>
  );
}
