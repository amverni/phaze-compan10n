import { useSetDefaultSitOutPenalty } from "../../data/hooks/useSettings";
import { PenaltySettingRow } from "./PenaltySettingRow";

interface DefaultSitOutPenaltySettingProps {
  value: number;
}

export function DefaultSitOutPenaltySetting({ value }: DefaultSitOutPenaltySettingProps) {
  const setDefaultSitOutPenalty = useSetDefaultSitOutPenalty();

  return (
    <PenaltySettingRow
      label="Default Sit Out Penalty"
      value={value}
      onChange={(next) => setDefaultSitOutPenalty.mutate(next)}
      disabled={setDefaultSitOutPenalty.isPending}
    />
  );
}
