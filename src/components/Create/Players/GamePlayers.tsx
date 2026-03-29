import { useQuery } from "@tanstack/react-query";
import { playersByIdsOptions } from "../../../data/hooks/usePlayers";
import { useGamePlayers } from "../CreateGameContext";

export function GamePlayers() {
  const playerIds = useGamePlayers();
  const { data: players = [] } = useQuery(playersByIdsOptions(playerIds));

  return (
    <section>
      <h2>In This Game</h2>
      <ul>
        {players.map((player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
    </section>
  );
}
