import { PenaltySettingRow } from "../../Settings/PenaltySettingRow";
import { useGameSettings, useSetSitOutPenalty } from "../CreateGameContext";

export function SitOutPenaltySetting() {
  const { sitOutPenalty } = useGameSettings();
  const setSitOutPenalty = useSetSitOutPenalty();

  return (
    <PenaltySettingRow label="Sit Out Penalty" value={sitOutPenalty} onChange={setSitOutPenalty} />
  );
}
