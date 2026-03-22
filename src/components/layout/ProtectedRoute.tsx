import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Spinner } from '../ui/Spinner'

export function ProtectedRoute() {
  const { initialized, isAuthenticated } = useAuth()

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
