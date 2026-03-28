import { useEffect } from 'react'
import { subscribeToOwnedSidequests } from '../firebase/sidequests'
import { useSideQuestStore } from '../store/sidequestStore'
import { useAuth } from './useAuth'

export function useSidequests() {
  const { user } = useAuth()
  const { ownedSidequests, setOwnedSidequests } = useSideQuestStore()

  useEffect(() => {
    if (!user) return
    return subscribeToOwnedSidequests(user.uid, setOwnedSidequests)
  }, [user?.uid])

  return { ownedSidequests }
}
