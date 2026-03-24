import { Timestamp } from 'firebase/firestore'

export type SideQuestStatus = 'incomplete' | 'complete' | 'failed'
export type SideQuestVisibility = 'public' | 'private'

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
  assigneeId: string | null
  assigneeDisplayName: string | null
  assigneePending: boolean
  completionPending: boolean
  visibility: SideQuestVisibility
  createdAt: Timestamp
  updatedAt: Timestamp
}
