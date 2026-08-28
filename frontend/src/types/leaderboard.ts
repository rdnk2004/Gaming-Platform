import { GameSlug } from './game'

export interface LeaderboardEntry {
  rank: number
  username: string
  avatar_url: string
  score: number
  level: number
}

export interface UserRankResponse {
  rank: number | null
  best_score: number
  message?: string
}

export interface PodiumItem extends LeaderboardEntry {
  medal: string
  class: 'gold' | 'silver' | 'bronze'
  height: string
  delay: number
}

export interface LeaderboardFilterState {
  game: GameSlug
  searchQuery: string
}
