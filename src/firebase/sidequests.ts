import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore'
import { db } from './config'
import type { SideQuest } from '../types/sidequest'
import type { SideQuestInput } from '../schemas/sidequestSchema'
import type { UserProfile } from '../types/user'
import { createNotification } from './notifications'

function inputToFirestore(data: SideQuestInput) {
  return {
    title: data.title,
    description: data.description,
    reward: data.reward,
    isEternal: data.isEternal,
    expiresAt: !data.isEternal && data.expiresAt
      ? Timestamp.fromDate(new Date(data.expiresAt))
      : null,
    visibility: data.visibility,
  }
}

export async function createSidequest(data: SideQuestInput, owner: UserProfile): Promise<string> {
  const ref = await addDoc(collection(db, 'sidequests'), {
    ...inputToFirestore(data),
    status: 'incomplete',
    ownerId: owner.uid,
    ownerDisplayName: owner.displayName,
    ownerPhotoURL: owner.photoURL,
    assigneeId: null,
    assigneeDisplayName: null,
    assigneePending: false,
    completionPending: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSidequest(id: string, data: SideQuestInput): Promise<void> {
  await updateDoc(doc(db, 'sidequests', id), {
    ...inputToFirestore(data),
    updatedAt: serverTimestamp(),
  })
}

export async function deleteSidequest(id: string): Promise<void> {
  await deleteDoc(doc(db, 'sidequests', id))
}

export async function getSidequest(id: string): Promise<SideQuest | null> {
  const snap = await getDoc(doc(db, 'sidequests', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as SideQuest
}

export function subscribeToOwnedSidequests(
  ownerId: string,
  callback: (quests: SideQuest[]) => void
): () => void {
  const q = query(
    collection(db, 'sidequests'),
    where('ownerId', '==', ownerId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SideQuest)))
  })
}

export function subscribeToAssignedSidequests(
  assigneeId: string,
  callback: (quests: SideQuest[]) => void
): () => void {
  const q = query(
    collection(db, 'sidequests'),
    where('assigneeId', '==', assigneeId),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SideQuest)))
  })
}

export async function assignSidequest(
  quest: SideQuest,
  assignee: UserProfile,
  owner: UserProfile
): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    assigneeId: assignee.uid,
    assigneeDisplayName: assignee.displayName,
    assigneePending: true,
    updatedAt: serverTimestamp(),
  })

  await createNotification(assignee.uid, {
    type: 'sidequest_assigned',
    fromUserId: owner.uid,
    fromUserDisplayName: owner.displayName,
    fromUserPhotoURL: owner.photoURL,
    sidequestId: quest.id,
    sidequestTitle: quest.title,
  })
}

export async function acceptAssignment(quest: SideQuest, assignee: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    assigneePending: false,
    updatedAt: serverTimestamp(),
  })

  await createNotification(quest.ownerId, {
    type: 'sidequest_accepted',
    fromUserId: assignee.uid,
    fromUserDisplayName: assignee.displayName,
    fromUserPhotoURL: assignee.photoURL,
    sidequestId: quest.id,
    sidequestTitle: quest.title,
  })
}

export async function rejectAssignment(quest: SideQuest, assignee: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    assigneeId: null,
    assigneeDisplayName: null,
    assigneePending: false,
    updatedAt: serverTimestamp(),
  })

  await createNotification(quest.ownerId, {
    type: 'sidequest_rejected',
    fromUserId: assignee.uid,
    fromUserDisplayName: assignee.displayName,
    fromUserPhotoURL: assignee.photoURL,
    sidequestId: quest.id,
    sidequestTitle: quest.title,
  })
}

export async function takeSidequest(quest: SideQuest, taker: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    assigneeId: taker.uid,
    assigneeDisplayName: taker.displayName,
    assigneePending: false,
    updatedAt: serverTimestamp(),
  })

  if (quest.ownerId !== taker.uid) {
    await createNotification(quest.ownerId, {
      type: 'sidequest_assigned',
      fromUserId: taker.uid,
      fromUserDisplayName: taker.displayName,
      fromUserPhotoURL: taker.photoURL,
      sidequestId: quest.id,
      sidequestTitle: quest.title,
    })
  }
}

export async function completeSidequest(quest: SideQuest): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    status: 'complete',
    completionPending: false,
    updatedAt: serverTimestamp(),
  })
}

export async function requestCompletion(quest: SideQuest, assignee: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    completionPending: true,
    updatedAt: serverTimestamp(),
  })

  await createNotification(quest.ownerId, {
    type: 'sidequest_completion_requested',
    fromUserId: assignee.uid,
    fromUserDisplayName: assignee.displayName,
    fromUserPhotoURL: assignee.photoURL,
    sidequestId: quest.id,
    sidequestTitle: quest.title,
  })
}

export async function confirmCompletion(quest: SideQuest, owner: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    status: 'complete',
    completionPending: false,
    updatedAt: serverTimestamp(),
  })

  if (quest.assigneeId && quest.assigneeId !== owner.uid) {
    await createNotification(quest.assigneeId, {
      type: 'sidequest_completed',
      fromUserId: owner.uid,
      fromUserDisplayName: owner.displayName,
      fromUserPhotoURL: owner.photoURL,
      sidequestId: quest.id,
      sidequestTitle: quest.title,
    })
  }
}

export async function failSidequest(quest: SideQuest, assignee: UserProfile): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    status: 'failed',
    updatedAt: serverTimestamp(),
  })

  if (quest.ownerId !== assignee.uid) {
    await createNotification(quest.ownerId, {
      type: 'sidequest_failed',
      fromUserId: assignee.uid,
      fromUserDisplayName: assignee.displayName,
      fromUserPhotoURL: assignee.photoURL,
      sidequestId: quest.id,
      sidequestTitle: quest.title,
    })
  }
}

export async function abandonSidequest(quest: SideQuest): Promise<void> {
  await updateDoc(doc(db, 'sidequests', quest.id), {
    assigneeId: null,
    assigneeDisplayName: null,
    assigneePending: false,
    updatedAt: serverTimestamp(),
  })
}

export async function searchPublicSidequests(
  searchQuery: string,
  statusFilter: 'all' | 'incomplete' | 'complete' | 'failed' = 'incomplete'
): Promise<SideQuest[]> {
  let q

  if (searchQuery.trim()) {
    q = query(
      collection(db, 'sidequests'),
      where('visibility', '==', 'public'),
      orderBy('title'),
      where('title', '>=', searchQuery),
      where('title', '<=', searchQuery + '\uf8ff'),
      limit(50)
    )
  } else {
    const constraints = [
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(50),
    ]
    if (statusFilter !== 'all') {
      constraints.unshift(where('status', '==', statusFilter))
    }
    q = query(collection(db, 'sidequests'), ...constraints)
  }

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SideQuest))
}
