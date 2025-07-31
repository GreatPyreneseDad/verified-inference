import { create } from 'zustand'
import { User } from '@/types'
import { authService } from '@/services/authService'
import { SecureStorage } from '@/utils/secureStorage'
import { tokenManager } from '@/utils/tokenManager'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Set up logout callback to break circular dependency
  tokenManager.setLogoutCallback(() => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
    SecureStorage.clearAll()
  })

  return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login({ email, password })
          // Store token securely
          SecureStorage.setToken(response.token)
          SecureStorage.setUserData(response.user)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Login failed',
            isLoading: false,
          })
          throw error
        }
      },

      register: async (email: string, username: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.register({ email, username, password })
          // Store token securely
          SecureStorage.setToken(response.token)
          SecureStorage.setUserData(response.user)
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Registration failed',
            isLoading: false,
          })
          throw error
        }
      },

      logout: () => {
        // Clear secure storage
        SecureStorage.clearAll()
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: () => {
        // Check for valid token in secure storage
        if (SecureStorage.hasValidToken()) {
          const token = SecureStorage.getToken()
          const user = SecureStorage.getUserData()
          set({ 
            isAuthenticated: true,
            token,
            user
          })
        } else {
          // Clear invalid token
          SecureStorage.clearAll()
          set({ 
            isAuthenticated: false,
            token: null,
            user: null
          })
        }
      },

      clearError: () => set({ error: null }),
    }
})