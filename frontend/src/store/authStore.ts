import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState } from '../types/user'
import { authApi } from '../api/authApi'
import { API_URL } from '../api/client'

export { API_URL }

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null })
        try {
          const authData = await authApi.login(username, password)
          const user = await authApi.getCurrentUser(authData.access_token)

          set({
            user,
            token: authData.access_token,
            isLoading: false,
            error: null
          })
          return true
        } catch (error) {
          set({
            user: null,
            token: null,
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          })
          return false
        }
      },

      register: async (username: string, email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null })
        try {
          await authApi.register(username, email, password)
          set({ isLoading: false, error: null })
          return true
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false
          })
          return false
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null })
      },

      clearError: () => set({ error: null }),

      updateUserXp: (totalXp: number, level: number) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              xp: totalXp,
              level
            }
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
)
