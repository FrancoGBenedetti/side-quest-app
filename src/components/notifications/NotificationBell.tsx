import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { markAllNotificationsRead, markNotificationRead } from '../../firebase/notifications'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../ui/Avatar'
import { formatRelative } from '../../utils/formatDate'
import { cn } from '../../utils/cn'
import type { Notification } from '../../types/user'

export function NotificationBell() {
  const { user } = useAuth()
  const { notifications, unreadCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const notifLabels: Record<Notification['type'], string> = {
    friend_request: 'te envió una solicitud de amistad',
    friend_accepted: 'aceptó tu solicitud de amistad',
    friend_rejected: 'rechazó tu solicitud de amistad',
    sidequest_assigned: 'te asignó una sidequest',
    sidequest_accepted: 'aceptó tu sidequest',
    sidequest_rejected: 'rechazó tu sidequest',
    sidequest_completed: 'completó tu sidequest',
    sidequest_failed: 'falló tu sidequest',
  }

  async function handleNotifClick(notif: Notification) {
    if (!user) return
    if (!notif.read) await markNotificationRead(user.uid, notif.id)
    if (notif.sidequestId) navigate(`/quests/${notif.sidequestId}`)
    else if (notif.type === 'friend_request' || notif.type === 'friend_accepted') navigate('/friends')
    setOpen(false)
  }

  async function handleMarkAllRead() {
    if (!user) return
    await markAllNotificationsRead(user.uid)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-gray-800 bg-gray-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <span className="text-sm font-semibold text-white">Notificaciones</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-purple-400 hover:text-purple-300">
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">Sin notificaciones</p>
              ) : (
                notifications.slice(0, 20).map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotifClick(notif)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-800 transition-colors',
                      !notif.read && 'bg-purple-950/30'
                    )}
                  >
                    <Avatar
                      src={notif.fromUserPhotoURL}
                      name={notif.fromUserDisplayName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200">
                        <span className="font-medium">{notif.fromUserDisplayName}</span>{' '}
                        {notifLabels[notif.type]}
                        {notif.sidequestTitle && (
                          <span className="font-medium text-purple-400"> "{notif.sidequestTitle}"</span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {formatRelative(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
