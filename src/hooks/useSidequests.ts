import { useEffect } from 'react'
import { subscribeToOwnedSidequests, subscribeToAssignedSidequests } from '../firebase/sidequests'
import { useSideQuestStore } from '../store/sidequestStore'
import { useAuth } from './useAuth'

export function useSidequests() {
  const { user } = useAuth()
  const { ownedSidequests, assignedSidequests, setOwnedSidequests, setAssignedSidequests } = useSideQuestStore()

  useEffect(() => {
    if (!user) return

    const unsubOwned = subscribeToOwnedSidequests(user.uid, setOwnedSidequests)
    const unsubAssigned = subscribeToAssignedSidequests(user.uid, setAssignedSidequests)

    return () => {
      unsubOwned()
      unsubAssigned()
    }
  }, [user?.uid])

  return { ownedSidequests, assignedSidequests }
}
