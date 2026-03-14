export interface Player {
  id: PlayerId;
  name: string;
  color: string;
  createdAt: number;
  wins: number;
  isFavorite: 0 | 1; // indexdb doesn't support boolean indexes, so we use 0/1
}

export type PlayerId = string;
