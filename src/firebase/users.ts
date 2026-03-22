import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from './config'
import type { UserProfile } from '../types/user'

interface CreateUserProfileData {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

export async function createUserProfile(data: CreateUserProfileData): Promise<void> {
  const ref = doc(db, 'users', data.uid)
  const existing = await getDoc(ref)
  if (existing.exists()) return

  await setDoc(ref, {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    bio: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    friendIds: [],
    pendingRequestIds: [],
    sentRequestIds: [],
    notificationCount: 0,
  })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

export async function updateUserProfile(uid: string, data: { displayName?: string; bio?: string | null }): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function searchUsers(searchQuery: string, currentUid: string): Promise<UserProfile[]> {
  if (!searchQuery.trim()) return []

  const q = query(
    collection(db, 'users'),
    orderBy('displayName'),
    where('displayName', '>=', searchQuery),
    where('displayName', '<=', searchQuery + '\uf8ff'),
    limit(20)
  )

  const snap = await getDocs(q)
  return snap.docs
    .map((d) => d.data() as UserProfile)
    .filter((u) => u.uid !== currentUid)
}

export async function getUsersByIds(uids: string[]): Promise<UserProfile[]> {
  if (!uids.length) return []
  const profiles = await Promise.all(uids.map((uid) => getUserProfile(uid)))
  return profiles.filter(Boolean) as UserProfile[]
}
