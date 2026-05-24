import { useSetDefaultRoundSkipPenalty } from "../../data/hooks/useSettings";
import { PenaltySettingRow } from "./PenaltySettingRow";

interface DefaultRoundSkipPenaltySettingProps {
  value: number;
}

export function DefaultRoundSkipPenaltySetting({ value }: DefaultRoundSkipPenaltySettingProps) {
  const setDefaultRoundSkipPenalty = useSetDefaultRoundSkipPenalty();

  return (
    <PenaltySettingRow
      label="Default Round Skip Penalty"
      value={value}
      onChange={(next) => setDefaultRoundSkipPenalty.mutate(next)}
      disabled={setDefaultRoundSkipPenalty.isPending}
    />
  );
}
