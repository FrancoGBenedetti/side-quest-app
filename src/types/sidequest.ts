import type { Timestamp } from 'firebase/firestore'

/** 'open' = acepta suscriptores; 'closed' = lleno o cerrado por el owner */
export type SideQuestStatus = 'open' | 'closed'
export type SideQuestVisibility = 'public' | 'private'
export type EvidenceType = 'none' | 'photo' | 'text'

export interface SideQuest {
  id: string
  title: string
  description: string
  reward: string
  isEternal: boolean
  expiresAt: Timestamp | null
  status: SideQuestStatus
  ownerId: string
  ownerDisplayName: string
  ownerPhotoURL: string | null

  /** null = ilimitado */
  maxSubscribers: number | null
  /** Contadores denormalizados — actualizados vía transaction/batch */
  subscribersCount: number
  completedCount: number
  failedCount: number

  evidenceType: EvidenceType
  visibility: SideQuestVisibility
  /** IDs de las categorías seleccionadas (ref a QUEST_CATEGORIES) */
  tags: string[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
