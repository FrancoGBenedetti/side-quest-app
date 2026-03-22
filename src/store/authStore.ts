import { create } from 'zustand'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase/config'
import { getUserProfile } from '../firebase/users'
import type { UserProfile } from '../types/user'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  initialized: boolean
  loading: boolean
  error: string | null
  init: () => () => void
  setProfile: (profile: UserProfile | null) => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}

// Retry profile fetch up to 5 times with 500ms delay (handles race condition on register)
async function fetchProfileWithRetry(uid: string, retries = 5): Promise<UserProfile | null> {
  for (let i = 0; i < retries; i++) {
    const profile = await getUserProfile(uid)
    if (profile) return profile
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 500))
  }
  return null
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  initialized: false,
  loading: false,
  error: null,

  init: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchProfileWithRetry(user.uid)
        set({ user, profile, initialized: true })
      } else {
        set({ user: null, profile: null, initialized: true })
      }
    })
    return unsubscribe
  },

  setProfile: (profile) => set({ profile }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
}))
