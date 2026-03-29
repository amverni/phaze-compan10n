import { useQuery } from "@tanstack/react-query";
import { playerListOptions } from "../../../data/hooks/usePlayers";

export function FavoritePlayers() {
  const { data: favorites = [] } = useQuery(playerListOptions({ isFavorite: 1 }));

  return (
    <section>
      <h2>Favorites</h2>
      <ul>
        {favorites.map((player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
    </section>
  );
}
