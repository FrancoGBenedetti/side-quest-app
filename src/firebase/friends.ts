import {
  collection,
  doc,
  writeBatch,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDocs,
  limit,
} from 'firebase/firestore'
import { db } from './config'
import type { FriendRequest } from '../types/friendRequest'
import { createNotification } from './notifications'
import type { UserProfile } from '../types/user'

export async function sendFriendRequest(
  fromUser: UserProfile,
  toUserId: string
): Promise<void> {
  // Check if request already exists
  const existing = await getDocs(
    query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', fromUser.uid),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending'),
      limit(1)
    )
  )
  if (!existing.empty) return

  const batch = writeBatch(db)

  // Create friend request doc
  const requestRef = doc(collection(db, 'friendRequests'))
  batch.set(requestRef, {
    fromUserId: fromUser.uid,
    toUserId,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Update sender's sentRequestIds
  batch.update(doc(db, 'users', fromUser.uid), {
    sentRequestIds: arrayUnion(toUserId),
    updatedAt: serverTimestamp(),
  })

  // Update recipient's pendingRequestIds
  batch.update(doc(db, 'users', toUserId), {
    pendingRequestIds: arrayUnion(fromUser.uid),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  // Create notification for recipient
  await createNotification(toUserId, {
    type: 'friend_request',
    fromUserId: fromUser.uid,
    fromUserDisplayName: fromUser.displayName,
    fromUserPhotoURL: fromUser.photoURL,
    sidequestId: null,
    sidequestTitle: null,
  })
}

export async function acceptFriendRequest(
  requestId: string,
  fromUserId: string,
  toUser: UserProfile
): Promise<void> {
  const batch = writeBatch(db)

  batch.update(doc(db, 'friendRequests', requestId), {
    status: 'accepted',
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', toUser.uid), {
    friendIds: arrayUnion(fromUserId),
    pendingRequestIds: arrayRemove(fromUserId),
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', fromUserId), {
    friendIds: arrayUnion(toUser.uid),
    sentRequestIds: arrayRemove(toUser.uid),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  await createNotification(fromUserId, {
    type: 'friend_accepted',
    fromUserId: toUser.uid,
    fromUserDisplayName: toUser.displayName,
    fromUserPhotoURL: toUser.photoURL,
    sidequestId: null,
    sidequestTitle: null,
  })
}

export async function rejectFriendRequest(
  requestId: string,
  fromUserId: string,
  toUser: UserProfile
): Promise<void> {
  const batch = writeBatch(db)

  batch.update(doc(db, 'friendRequests', requestId), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', toUser.uid), {
    pendingRequestIds: arrayRemove(fromUserId),
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', fromUserId), {
    sentRequestIds: arrayRemove(toUser.uid),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

export async function withdrawFriendRequest(
  requestId: string,
  fromUser: UserProfile,
  toUserId: string
): Promise<void> {
  const batch = writeBatch(db)

  batch.delete(doc(db, 'friendRequests', requestId))

  batch.update(doc(db, 'users', fromUser.uid), {
    sentRequestIds: arrayRemove(toUserId),
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', toUserId), {
    pendingRequestIds: arrayRemove(fromUser.uid),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

export async function removeFriend(currentUser: UserProfile, friendId: string): Promise<void> {
  const batch = writeBatch(db)

  batch.update(doc(db, 'users', currentUser.uid), {
    friendIds: arrayRemove(friendId),
    updatedAt: serverTimestamp(),
  })

  batch.update(doc(db, 'users', friendId), {
    friendIds: arrayRemove(currentUser.uid),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()
}

export function subscribeToPendingRequests(
  userId: string,
  callback: (requests: FriendRequest[]) => void
): () => void {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUserId', '==', userId),
    where('status', '==', 'pending')
  )

  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest))
    callback(requests)
  })
}

export async function getPendingRequestId(fromUserId: string, toUserId: string): Promise<string | null> {
  const q = query(
    collection(db, 'friendRequests'),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId),
    where('status', '==', 'pending'),
    limit(1)
  )
  const snap = await getDocs(q)
  return snap.empty ? null : snap.docs[0].id
}
