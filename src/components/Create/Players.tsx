import { FavoritePlayers } from "./Players/FavoritePlayers";
import { GamePlayers } from "./Players/GamePlayers";

export function Players() {
  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <GamePlayers />
      <FavoritePlayers />
    </div>
  );
}
