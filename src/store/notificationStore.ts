import { create } from 'zustand'
import type { Notification } from '../types/user'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    }),
}))
