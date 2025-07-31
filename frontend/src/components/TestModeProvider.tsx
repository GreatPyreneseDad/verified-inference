import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function TestModeProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setToken } = useAuthStore()

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
      }
    }
    
    setUser(testUser)
    setToken('test-mode-token')
  }, [setUser, setToken])

  return <>{children}</>
}