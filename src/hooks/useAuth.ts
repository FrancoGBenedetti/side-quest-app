import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, profile, initialized, loading, error } = useAuthStore()
  return { user, profile, initialized, loading, error, isAuthenticated: !!user }
}
