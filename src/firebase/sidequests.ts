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
import { QUEST_CONFIG } from '../config/questConfig'
import type { SideQuest } from '../types/sidequest'
import type { SideQuestInput } from '../schemas/sidequestSchema'
import type { UserProfile } from '../types/user'

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
    evidenceType: data.evidenceType,
    maxSubscribers: data.maxSubscribers ?? QUEST_CONFIG.defaultMaxSubscribers,
    tags: data.tags ?? [],
  }
}

export async function createSidequest(data: SideQuestInput, owner: UserProfile): Promise<string> {
  const ref = await addDoc(collection(db, 'sidequests'), {
    ...inputToFirestore(data),
    status: 'open',
    ownerId: owner.uid,
    ownerDisplayName: owner.displayName,
    ownerPhotoURL: owner.photoURL,
    subscribersCount: 0,
    completedCount: 0,
    failedCount: 0,
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

export async function closeSidequest(id: string): Promise<void> {
  await updateDoc(doc(db, 'sidequests', id), {
    status: 'closed',
    updatedAt: serverTimestamp(),
  })
}

export async function reopenSidequest(id: string): Promise<void> {
  await updateDoc(doc(db, 'sidequests', id), {
    status: 'open',
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

export async function searchPublicSidequests(
  searchQuery: string,
  statusFilter: 'all' | 'open' | 'closed' = 'open',
  tagFilter?: string
): Promise<SideQuest[]> {
  let q

  if (searchQuery.trim()) {
    // Búsqueda por texto: no combinamos con tag para evitar índices extra
    q = query(
      collection(db, 'sidequests'),
      where('visibility', '==', 'public'),
      orderBy('title'),
      where('title', '>=', searchQuery),
      where('title', '<=', searchQuery + '\uf8ff'),
      limit(50)
    )
  } else {
    const constraints: Parameters<typeof query>[1][] = [
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(50),
    ]
    if (statusFilter !== 'all') {
      constraints.unshift(where('status', '==', statusFilter))
    }
    if (tagFilter) {
      constraints.unshift(where('tags', 'array-contains', tagFilter))
    }
    q = query(collection(db, 'sidequests'), ...constraints)
  }

  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SideQuest))
}
