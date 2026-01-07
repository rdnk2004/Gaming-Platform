import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: number
    username: string
    email: string
    avatar_url: string
    xp: number
    level: number
}

interface AuthState {
    user: User | null
    token: string | null
    isLoading: boolean
    error: string | null

    login: (username: string, password: string) => Promise<boolean>
    register: (username: string, email: string, password: string) => Promise<boolean>
    logout: () => void
    clearError: () => void
}

const API_URL = 'http://localhost:8000'

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            login: async (username: string, password: string) => {
                set({ isLoading: true, error: null })
                try {
                    const formData = new FormData()
                    formData.append('username', username)
                    formData.append('password', password)

                    const response = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        body: formData,
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.detail || 'Login failed')
                    }

                    const data = await response.json()

                    // Fetch user profile
                    const userResponse = await fetch(`${API_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${data.access_token}`
                        }
                    })

                    if (!userResponse.ok) throw new Error('Failed to fetch user')

                    const user = await userResponse.json()

                    set({ user, token: data.access_token, isLoading: false })
                    return true
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false })
                    return false
                }
            },

            register: async (username: string, email: string, password: string) => {
                set({ isLoading: true, error: null })
                try {
                    const response = await fetch(`${API_URL}/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, email, password }),
                    })

                    if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.detail || 'Registration failed')
                    }

                    set({ isLoading: false })
                    return true
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false })
                    return false
                }
            },

            logout: () => {
                set({ user: null, token: null })
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, token: state.token }),
        }
    )
)
