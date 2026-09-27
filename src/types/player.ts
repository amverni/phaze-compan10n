export interface PlayerIdentity {
  id: PlayerId;
  name: string;
  color: string;
}

export interface Player extends PlayerIdentity {
  createdAt: number;
  isFavorite: 0 | 1; // indexdb doesn't support boolean indexes, so we use 0/1
}

export type PlayerId = string;
