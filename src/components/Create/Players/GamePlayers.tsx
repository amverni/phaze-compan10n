import { shuffle } from "../../../utils";
import type { SortableItem } from "../../ui";
import { List } from "../../ui";
import { useGamePlayers, useRemovePlayer, useReorderPlayers } from "../CreateGameContext";
import { AddPlayerButton } from "./AddPlayerButton";
import { PlayerRow } from "./PlayerRow";
import { ShufflePlayersButton } from "./ShufflePlayersButton";

export function GamePlayers() {
  const players = useGamePlayers();
  const removePlayer = useRemovePlayer();
  const reorderPlayers = useReorderPlayers();

  function handleReorder(items: SortableItem[]) {
    const playersById = new Map(players.map((player) => [player.id, player]));
    const reordered = items.map((item) => playersById.get(item.id)).filter((p) => p !== undefined);
    reorderPlayers(reordered);
  }

  function handleShuffle() {
    if (players.length < 2) return;
    reorderPlayers(shuffle(players));
  }

  const items = players.map((p) => ({ id: p.id, label: p.name }));

  return (
    <section>
      <div className="flex items-center justify-end pb-2">
        <ShufflePlayersButton onClick={handleShuffle} disabled={players.length < 2} />
      </div>
      <List sortable removable items={items} onReorder={handleReorder} onRemove={removePlayer}>
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
        <AddPlayerButton key="add-player" />
      </List>
    </section>
  );
}
