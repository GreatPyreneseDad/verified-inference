import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { SecureStorage } from '@/utils/secureStorage'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Store CSRF token
let csrfToken: string | null = null

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CSRF cookies if used
})

// Function to fetch CSRF token
export const fetchCSRFToken = async () => {
  try {
    const response = await api.get('/csrf-token')
    csrfToken = response.data.csrfToken
    return csrfToken
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error)
    return null
  }
}

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  async (config) => {
    // Add auth token from secure storage
    const token = SecureStorage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase() || '')) {
      // Skip CSRF for auth endpoints
      if (!config.url?.includes('/auth/login') && !config.url?.includes('/auth/register')) {
        if (!csrfToken) {
          await fetchCSRFToken()
        }
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken
        }
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    // Handle CSRF token errors
    if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      // Refresh CSRF token and retry request
      csrfToken = null
      return fetchCSRFToken().then(() => {
        // Retry the original request with new CSRF token
        error.config.headers['X-CSRF-Token'] = csrfToken
        return api.request(error.config)
      })
    }
    return Promise.reject(error)
  }
)