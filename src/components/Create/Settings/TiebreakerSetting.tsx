import { TiebreakerSettingRow } from "../../Settings/TiebreakerSettingRow";
import { useGameSettings, useSetTiebreaker } from "../CreateGameContext";

export function TiebreakerSetting() {
  const { tiebreaker } = useGameSettings();
  const setTiebreaker = useSetTiebreaker();

  return <TiebreakerSettingRow label="Tiebreaker" value={tiebreaker} onChange={setTiebreaker} />;
}
