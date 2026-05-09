import { useSetDefaultTiebreaker } from "../../data/hooks/useSettings";
import type { GameTiebreaker } from "../../types";
import { TiebreakerSettingRow } from "./TiebreakerSettingRow";

interface DefaultTiebreakerSettingProps {
  value: GameTiebreaker;
}

export function DefaultTiebreakerSetting({ value }: DefaultTiebreakerSettingProps) {
  const setDefaultTiebreaker = useSetDefaultTiebreaker();

  return (
    <TiebreakerSettingRow
      label="Default Tiebreaker"
      value={value}
      onChange={(tiebreaker) => setDefaultTiebreaker.mutate(tiebreaker)}
      disabled={setDefaultTiebreaker.isPending}
    />
  );
}
