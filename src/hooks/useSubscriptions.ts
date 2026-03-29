import { useEffect, useState } from 'react'
import { subscribeToUserSubscriptions } from '../firebase/subscriptions'
import { useAuth } from './useAuth'
import type { QuestSubscription } from '../types/subscription'

export function useSubscriptions() {
  const { profile } = useAuth()
  const [subscriptions, setSubscriptions] = useState<QuestSubscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) {
      setSubscriptions([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToUserSubscriptions(profile.uid, (subs) => {
      setSubscriptions(subs)
      setLoading(false)
    })

    return unsubscribe
  }, [profile?.uid])

  return { subscriptions, loading }
}
