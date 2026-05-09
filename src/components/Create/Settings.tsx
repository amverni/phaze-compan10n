import { List } from "../ui";
import { TiebreakerSetting } from "./Settings/TiebreakerSetting";

export function Settings() {
  return (
    <div className="py-4">
      <List allowOverflow>
        <TiebreakerSetting key="tiebreaker" />
      </List>
    </div>
  );
}
