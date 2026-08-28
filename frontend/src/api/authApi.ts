/**
 * CYBERARCADE - AUTHENTICATION API ENDPOINTS
 */

import { apiClient } from './client'
import { User, AuthResponse } from '../types/user'

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    return apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: formData
    })
  },

  register: async (username: string, email: string, password: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })
  },

  getCurrentUser: async (token: string): Promise<User> => {
    return apiClient<User>('/auth/me', {
      method: 'GET',
      token
    })
  }
}
