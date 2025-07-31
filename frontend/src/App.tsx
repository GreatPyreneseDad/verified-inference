import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Layout } from '@/components/Layout'
import { TestModeProvider } from '@/components/TestModeProvider'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { QueryPage } from '@/pages/QueryPage'
import { VerifyPage } from '@/pages/VerifyPage'

function App() {
  // TESTING MODE: Bypass authentication
  return (
    <TestModeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<Navigate to="/dashboard" replace />} />
          <Route path="register" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="query" element={<QueryPage />} />
          <Route path="verify" element={<VerifyPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </TestModeProvider>
  )
}

export default App