/**
 * CYBERARCADE - CENTRALIZED API CLIENT
 * Type-safe HTTP request wrapper with JWT interceptor and error normalization
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  public status: number
  public detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...customConfig } = options

  const requestHeaders: Record<string, string> = {
    ...((headers as Record<string, string>) || {})
  }

  // Inject Authorization Bearer token if present
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...customConfig,
    headers: requestHeaders
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`

  const response = await fetch(url, config)

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`
    try {
      const errorData = await response.json()
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((e: { msg?: string }) => e.msg || '').join(', ')
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    } catch {
      // Body not JSON
    }
    throw new ApiError(response.status, errorMessage)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}
