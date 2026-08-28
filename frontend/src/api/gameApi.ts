/**
 * CYBERARCADE - LEADERBOARD & GAME API ENDPOINTS
 */

import { apiClient } from './client'
import { GameSlug, ScoreSubmissionPayload, ScoreSubmissionResponse } from '../types/game'
import { LeaderboardEntry, UserRankResponse } from '../types/leaderboard'

export const gameApi = {
  getLeaderboard: async (gameSlug: GameSlug, limit = 20): Promise<LeaderboardEntry[]> => {
    return apiClient<LeaderboardEntry[]>(`/leaderboard/${gameSlug}?limit=${limit}`)
  },

  getMyRank: async (gameSlug: GameSlug, token: string): Promise<UserRankResponse> => {
    return apiClient<UserRankResponse>(`/leaderboard/${gameSlug}/me`, {
      method: 'GET',
      token
    })
  },

  submitScore: async (
    payload: ScoreSubmissionPayload,
    token: string
  ): Promise<ScoreSubmissionResponse> => {
    return apiClient<ScoreSubmissionResponse>('/leaderboard/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      token,
      body: JSON.stringify(payload)
    })
  }
}
