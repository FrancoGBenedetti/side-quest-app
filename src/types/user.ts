import { Timestamp } from 'firebase/firestore'

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
  fromUserId: string
  fromUserDisplayName: string
  fromUserPhotoURL: string | null
  sidequestId: string | null
  sidequestTitle: string | null
  read: boolean
  createdAt: Timestamp
}
