import { api } from '@/lib/axios'
import { LoginCredentials, RegisterCredentials, User } from '@/types'

interface AuthResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post<AuthResponse>('/auth/login', credentials)
    return response.data.data
  },

  async register(credentials: RegisterCredentials) {
    const response = await api.post<AuthResponse>('/auth/register', credentials)
    return response.data.data
  },

  async getProfile() {
    const response = await api.get<{ success: boolean; data: { user: User } }>('/auth/profile')
    return response.data.data.user
  },
}