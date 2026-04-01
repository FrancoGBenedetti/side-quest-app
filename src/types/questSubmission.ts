import type { Timestamp } from 'firebase/firestore'

export type SubmissionStatus = 'pending' | 'complete' | 'failed'

export interface QuestSubmission {
  id: string
  userId: string
  userDisplayName: string
  userPhotoURL: string | null
  evidenceText: string | null
  evidenceImageUrl: string | null
  status: SubmissionStatus
  rating: number | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
