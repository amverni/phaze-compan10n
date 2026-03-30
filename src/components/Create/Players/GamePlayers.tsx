import { List } from "../../ui/List/List";
import { useGamePlayers } from "../CreateGameContext";
import { AddPlayerDialog } from "./AddPlayerDialog";
import { PlayerRow } from "./PlayerRow";

export function GamePlayers() {
  const players = useGamePlayers();

  return (
    <section>
      <h2>In This Game</h2>
      <List>
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
        <AddPlayerDialog />
      </List>
    </section>
  );
}
