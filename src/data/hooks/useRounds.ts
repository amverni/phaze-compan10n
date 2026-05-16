import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ArrayAtLeastOne, GameId, PlayerId, Round, RoundScore } from "../../types";
import { roundsApi } from "../api/rounds";
import { gameKeys } from "./useGames";

type AddRoundScoreInput = Omit<RoundScore, "currentPhase">;

export const roundKeys = {
  all: ["rounds"] as const,
  lists: () => [...roundKeys.all, "list"] as const,
  list: (gameId: GameId) => [...roundKeys.lists(), gameId] as const,
};

export function roundsListOptions(gameId: GameId) {
  return queryOptions({
    queryKey: roundKeys.list(gameId),
    queryFn: () => roundsApi.getByGameId(gameId),
    enabled: !!gameId,
  });
}

export function useAddRound(gameId: GameId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { scores: ArrayAtLeastOne<AddRoundScoreInput>; roundWinnerId: PlayerId }) =>
      roundsApi.add({ gameId, ...data }),
    onSuccess: (round: Round) => {
      queryClient.invalidateQueries({ queryKey: roundKeys.list(round.gameId) });
      queryClient.invalidateQueries({ queryKey: gameKeys.detail(round.gameId) });
    },
  });
}
