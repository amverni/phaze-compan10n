import { useQuery } from "@tanstack/react-query";
import { phaseSetListOptions } from "../../data/hooks/usePhaseSets";
import { useSetDefaultPhaseSetId } from "../../data/hooks/useSettings";
import type { PhaseSetId } from "../../types";
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
  SettingListRow,
} from "../ui";

interface DefaultPhaseSetSettingProps {
  value: PhaseSetId;
}

export function DefaultPhaseSetSetting({ value }: DefaultPhaseSetSettingProps) {
  const { data: phaseSets = [], isLoading } = useQuery(phaseSetListOptions());
  const setDefaultPhaseSetId = useSetDefaultPhaseSetId();
  const selectedPhaseSet = phaseSets.find((phaseSet) => phaseSet.id === value);
  const selectedLabel = selectedPhaseSet?.name ?? (isLoading ? "Loading..." : value);

  return (
    <Listbox
      value={value}
      onChange={(phaseSetId) => setDefaultPhaseSetId.mutate(phaseSetId)}
      disabled={isLoading || setDefaultPhaseSetId.isPending}
      className="w-full min-w-0"
    >
      <SettingListRow label={<ListboxLabel>Default Phase Set</ListboxLabel>}>
        <ListboxButton variant="plain" className="shrink-0">
          {selectedLabel}
        </ListboxButton>
        <ListboxOptions
          align="right"
          anchor={{ to: "bottom end", gap: "0.25rem", padding: "1rem" }}
          transformOrigin="top-right"
        >
          {phaseSets.map(({ id, name }) => (
            <ListboxOption key={id} value={id}>
              {name}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </SettingListRow>
    </Listbox>
  );
}
