import { Timestamp } from 'firebase/firestore'

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: FriendRequestStatus
  createdAt: Timestamp
  updatedAt: Timestamp
}
