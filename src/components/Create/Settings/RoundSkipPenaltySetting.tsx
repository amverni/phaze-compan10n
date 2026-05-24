import { PenaltySettingRow } from "../../Settings/PenaltySettingRow";
import { useGameSettings, useSetRoundSkipPenalty } from "../CreateGameContext";

export function RoundSkipPenaltySetting() {
  const { roundSkipPenalty } = useGameSettings();
  const setRoundSkipPenalty = useSetRoundSkipPenalty();

  return (
    <PenaltySettingRow
      label="Round Skip Penalty"
      value={roundSkipPenalty}
      onChange={setRoundSkipPenalty}
    />
  );
}
