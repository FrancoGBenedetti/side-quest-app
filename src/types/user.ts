import { Timestamp } from 'firebase/firestore'
import type { EvidenceType } from './sidequest'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
  bio: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
  friendIds: string[]
  pendingRequestIds: string[]
  sentRequestIds: string[]
  notificationCount: number
  /** Contador de quests completadas (denormalizado para el perfil) */
  completedQuestsCount?: number
}

/**
 * Entrada en la subcollección users/{uid}/completedQuests/{questId}.
 * Escrita por el owner al confirmar el completado.
 */
export interface CompletedQuestEntry {
  questId: string
  questTitle: string
  questReward: string
  questOwnerId: string
  questOwnerDisplayName: string
  /** IDs de categorías del quest al momento de completarlo */
  tags: string[]
  evidenceType: EvidenceType
  /** Calificación 1-5 asignada por el owner, null si no calificó */
  rating: number | null
  completedAt: Timestamp
}

export interface Notification {
  id: string
  type:
    | 'friend_request'
    | 'friend_accepted'
    | 'friend_rejected'
    | 'sidequest_assigned'
    | 'sidequest_accepted'
    | 'sidequest_rejected'
    | 'sidequest_completion_requested'
    | 'sidequest_completed'
    | 'sidequest_failed'
    | 'sidequest_evidence_rejected'
    | 'sidequest_removed'
  fromUserId: string
  fromUserDisplayName: string
  fromUserPhotoURL: string | null
  sidequestId: string | null
  sidequestTitle: string | null
  read: boolean
  createdAt: Timestamp
}
