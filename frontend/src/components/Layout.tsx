import { Link, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { Brain, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-6 w-6" />
              <span className="text-xl font-bold">Verified Inference</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-sm font-medium hover:text-primary">
                    Dashboard
                  </Link>
                  <Link to="/query" className="text-sm font-medium hover:text-primary">
                    New Query
                  </Link>
                  <Link to="/verify" className="text-sm font-medium hover:text-primary">
                    Verify
                  </Link>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-muted-foreground">
                      {user?.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center space-x-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-4">
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/query"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    New Query
                  </Link>
                  <Link
                    to="/verify"
                    className="text-sm font-medium hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Verify
                  </Link>
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">
                      {user?.username}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="flex items-center space-x-1"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Verified Inference System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}