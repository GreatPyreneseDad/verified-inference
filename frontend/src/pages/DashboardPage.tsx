import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import { queryService } from '@/services/queryService'
import { Brain, CheckCircle, PlusCircle, TrendingUp } from 'lucide-react'

export function DashboardPage() {
  const { user, isAuthenticated } = useAuthStore()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
    enabled: isAuthenticated,
  })

  const { data: queries } = useQuery({
    queryKey: ['queries'],
    queryFn: () => queryService.getQueries({ limit: 5 }),
    enabled: isAuthenticated,
  })

  const stats = profile?.stats || user?.stats || {
    totalQueries: 0,
    totalVerifications: 0,
    correctVerifications: 0,
    accuracy: 0,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.username || user?.username}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Queries
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Verifications
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVerifications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Correct
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.correctVerifications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Accuracy
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accuracy}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Queries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Queries</CardTitle>
              <CardDescription>
                Your latest inference generation requests
              </CardDescription>
            </div>
            <Link to="/query">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Query
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {queries?.queries && queries.queries.length > 0 ? (
            <div className="space-y-4">
              {queries.queries.map((query) => (
                <div
                  key={query.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{query.topic}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(query.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/query/${query.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No queries yet. Start by creating your first query!
              </p>
              <Link to="/query">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Query
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}