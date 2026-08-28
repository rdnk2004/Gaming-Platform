export interface User {
  id: number
  username: string
  email: string
  avatar_url: string
  xp: number
  level: number
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null

  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
  updateUserXp: (totalXp: number, level: number) => void
}
