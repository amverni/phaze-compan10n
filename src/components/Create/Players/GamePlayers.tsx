import type { SortableItem } from "../../ui";
import { List } from "../../ui";
import { useGamePlayers, useRemovePlayer, useReorderPlayers } from "../CreateGameContext";
import { AddPlayerButton } from "./AddPlayerButton";
import { PlayerRow } from "./PlayerRow";

export function GamePlayers() {
  const players = useGamePlayers();
  const removePlayer = useRemovePlayer();
  const reorderPlayers = useReorderPlayers();

  function handleReorder(items: SortableItem[]) {
    const reordered = items
      .map((item) => players.find((p) => p.id === item.id))
      .filter((p) => p !== undefined);
    reorderPlayers(reordered);
  }

  const items = players.map((p) => ({ id: p.id }));

  return (
    <section>
      <List
        sortable
        removable
        items={items}
        onReorder={handleReorder}
        onRemove={(id) => removePlayer(id as string)}
        animateNewItems
      >
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
        <AddPlayerButton />
      </List>
    </section>
  );
}
