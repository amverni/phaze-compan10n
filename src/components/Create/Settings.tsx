import { List } from "../ui";
import { ResetSettingsButton } from "./Settings/ResetSettingsButton";
import { RoundSkipPenaltySetting } from "./Settings/RoundSkipPenaltySetting";
import { SitOutPenaltySetting } from "./Settings/SitOutPenaltySetting";
import { TiebreakerSetting } from "./Settings/TiebreakerSetting";

export function Settings() {
  return (
    <div className="py-4">
      <div className="flex items-center justify-end pb-2">
        <ResetSettingsButton />
      </div>
      <List allowOverflow>
        <TiebreakerSetting key="tiebreaker" />
        <RoundSkipPenaltySetting key="roundSkipPenalty" />
        <SitOutPenaltySetting key="sitOutPenalty" />
      </List>
    </div>
  );
}
