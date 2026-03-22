import { useState, useEffect } from 'react'
import { getUsersByIds } from '../firebase/users'
import { subscribeToPendingRequests } from '../firebase/friends'
import type { FriendRequest } from '../types/friendRequest'
import type { UserProfile } from '../types/user'
import { useAuth } from './useAuth'

export function useFriends() {
  const { user, profile } = useAuth()
  const [friends, setFriends] = useState<UserProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)

  // Load friends whenever friendIds changes
  useEffect(() => {
    if (!profile) {
      setFriends([])
      return
    }
    if (!profile.friendIds.length) {
      setFriends([])
      return
    }

    setLoadingFriends(true)
    getUsersByIds(profile.friendIds)
      .then(setFriends)
      .finally(() => setLoadingFriends(false))
  }, [profile?.friendIds?.join(',')])

  // Subscribe to incoming requests
  useEffect(() => {
    if (!user) return
    const unsub = subscribeToPendingRequests(user.uid, setPendingRequests)
    return unsub
  }, [user?.uid])

  return { friends, pendingRequests, loadingFriends }
}
