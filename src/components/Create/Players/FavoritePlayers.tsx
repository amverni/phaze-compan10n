import { useEffect, useState } from "react";
import { List } from "../../ui/List/List";

const DUMMY_PLAYERS = [
  { id: "1", name: "Andrew" },
  { id: "2", name: "Sam" },
];

export function FavoritePlayers() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section>
      <h2>Favorites</h2>
      <List isLoading={isLoading} shimmerRows={2}>
        {!isLoading && DUMMY_PLAYERS.map((player) => <span key={player.id}>{player.name}</span>)}
      </List>
    </section>
  );
}
