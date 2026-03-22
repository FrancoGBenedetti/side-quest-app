import { useEffect } from 'react'
import { subscribeToNotifications } from '../firebase/notifications'
import { useNotificationStore } from '../store/notificationStore'
import { useAuth } from './useAuth'

export function useNotifications() {
  const { user } = useAuth()
  const { notifications, unreadCount, setNotifications } = useNotificationStore()

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToNotifications(user.uid, setNotifications)
    return unsub
  }, [user?.uid])

  return { notifications, unreadCount }
}
