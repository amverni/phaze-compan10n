import { useQuery } from "@tanstack/react-query";
import { playerListOptions } from "../../../data/hooks/usePlayers";
import { List } from "../../ui";
import { useAddPlayer, useGamePlayers } from "../CreateGameContext";
import { AddPlayerRow } from "./AddPlayerRow";

export function FavoritePlayers() {
  const addPlayer = useAddPlayer();
  const gamePlayers = useGamePlayers();
  const gamePlayerIds = new Set(gamePlayers.map((p) => p.id));
  const { data: favorites = [], isLoading } = useQuery(playerListOptions({ isFavorite: 1 }));

  if (!favorites.length) {
    return null;
  }

  return (
    <section>
      <h2>Favorites</h2>
      <List isLoading={isLoading} shimmerRows={2}>
        {favorites.map((player) => (
          <AddPlayerRow
            key={player.id}
            player={player}
            onSelect={addPlayer}
            disabled={gamePlayerIds.has(player.id)}
            showFavoriteAccent={false}
          />
        ))}
      </List>
    </section>
  );
}
