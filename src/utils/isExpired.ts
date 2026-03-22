import { Timestamp } from 'firebase/firestore'
import type { SideQuest } from '../types/sidequest'

export function isExpired(quest: SideQuest): boolean {
  if (quest.isEternal || !quest.expiresAt) return false
  const expiryDate = quest.expiresAt instanceof Timestamp
    ? quest.expiresAt.toDate()
    : new Date(quest.expiresAt)
  return expiryDate < new Date()
}

export function getTimeRemaining(quest: SideQuest): { expired: boolean; urgent: boolean; label: string } {
  if (quest.isEternal || !quest.expiresAt) {
    return { expired: false, urgent: false, label: 'Eterna' }
  }
  const expiryDate = quest.expiresAt instanceof Timestamp
    ? quest.expiresAt.toDate()
    : new Date(quest.expiresAt)
  const now = new Date()
  const diff = expiryDate.getTime() - now.getTime()

  if (diff <= 0) return { expired: true, urgent: true, label: 'Expirada' }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)

  if (days > 0) return { expired: false, urgent: hours < 24, label: `${days}d restantes` }
  if (hours > 0) return { expired: false, urgent: true, label: `${hours}h restantes` }

  const minutes = Math.floor(diff / (1000 * 60))
  return { expired: false, urgent: true, label: `${minutes}m restantes` }
}
