import {
  collection,
  doc,
  addDoc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  where,
} from 'firebase/firestore'
import { db } from './config'
import type { Notification } from '../types/user'

type CreateNotificationData = Omit<Notification, 'id' | 'createdAt' | 'read'>

export async function createNotification(toUserId: string, data: CreateNotificationData): Promise<void> {
  const notifRef = collection(db, 'users', toUserId, 'notifications')
  await addDoc(notifRef, {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  })
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
): () => void {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification))
    callback(notifications)
  })
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true })
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'users', userId, 'notifications'),
    where('read', '==', false)
  )
  const snap = await getDocs(q)
  if (snap.empty) return

  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }))
  await batch.commit()
}
