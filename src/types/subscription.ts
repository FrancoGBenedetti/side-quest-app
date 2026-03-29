import type { Timestamp } from 'firebase/firestore'
import type { EvidenceType } from './sidequest'

export type SubscriptionStatus = 'pending' | 'active' | 'complete' | 'failed' | 'abandoned'

export interface QuestSubscription {
  /** userId = document ID en la subcollección */
  userId: string
  userDisplayName: string
  userPhotoURL: string | null

  /** Datos denormalizados del quest — evita N fetches en el Dashboard */
  questId: string
  questTitle: string
  questReward: string
  questOwnerId: string
  questOwnerDisplayName: string
  questEvidenceType: EvidenceType

  /** Estado individual del suscriptor */
  status: SubscriptionStatus
  completionPending: boolean
  evidenceData: string | null
  evidenceRejected: boolean
  /** Calificación 1-5 asignada por el owner al confirmar. null = sin calificación */
  rating: number | null

  joinedAt: Timestamp
  updatedAt: Timestamp
}
