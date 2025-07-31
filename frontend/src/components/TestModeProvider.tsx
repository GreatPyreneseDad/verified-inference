import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { SecureStorage } from '@/utils/secureStorage'

export function TestModeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set a fake user and token for testing mode
    const testUser = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'test@verified-inference.com',
      username: 'test_user',
      stats: {
        totalQueries: 0,
        totalVerifications: 0,
        correctVerifications: 0,
        accuracy: 0
      },
      createdAt: new Date().toISOString()
    }
    
    const testToken = 'test-mode-token'
    
    // Store in secure storage
    SecureStorage.setToken(testToken)
    SecureStorage.setUserData(testUser)
    
    // Update the store state directly
    useAuthStore.setState({
      user: testUser,
      token: testToken,
      isAuthenticated: true,
      isLoading: false,
      error: null
    })
  }, [])

  return <>{children}</>
}