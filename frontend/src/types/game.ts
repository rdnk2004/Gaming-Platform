export type GameSlug = 'snake' | 'tetris' | 'pong'

export interface GameInfo {
  id: number
  name: string
  slug: GameSlug
  description: string
  isMultiplayer: boolean
  icon: string
  color: string
  glow: string
  bgGradient: string
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife?: number
  color: string
  size: number
  decay?: number
}

export interface ScoreSubmissionPayload {
  game_slug: GameSlug
  score: number
  duration_seconds: number
}

export interface ScoreSubmissionResponse {
  message: string
  xp_earned: number
  total_xp: number
  level: number
}
