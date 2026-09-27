import type { CompletedGameMetadata, Game, PlayerId, PlayerIdentity } from "../../types";

export function getGamePlayers(
  game: Game,
  livePlayers: readonly PlayerIdentity[],
): PlayerIdentity[] {
  const identities = game.status === "completed" ? game.playerSnapshots : livePlayers;
  const byId = new Map(identities.map((player) => [player.id, player]));
  const included = new Set(game.status === "active" ? game.activePlayers : game.players);
  return game.players
    .filter((id) => included.has(id))
    .map((id) => {
      const player = byId.get(id);
      if (!player) throw new Error(`Player identity not found: ${id}`);
      return player;
    });
}

export function capturePlayerSnapshots(
  playerIds: readonly PlayerId[],
  players: readonly PlayerIdentity[],
): CompletedGameMetadata["playerSnapshots"] {
  const byId = new Map(players.map((player) => [player.id, player]));
  return playerIds.map((id) => {
    const player = byId.get(id);
    if (!player) throw new Error(`Player identity not found: ${id}`);
    return { id: player.id, name: player.name, color: player.color };
  });
}
