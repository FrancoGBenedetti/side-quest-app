import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from './config'
import { createNotification } from './notifications'
import type { SideQuest } from '../types/sidequest'
import type { QuestSubscription, SubscriptionStatus } from '../types/subscription'
import type { UserProfile } from '../types/user'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function subRef(questId: string, userId: string) {
  return doc(db, 'sidequests', questId, 'subscriptions', userId)
}

function questRef(questId: string) {
  return doc(db, 'sidequests', questId)
}

function buildSubscriptionData(
  user: UserProfile,
  quest: SideQuest,
  status: SubscriptionStatus
): Omit<QuestSubscription, 'joinedAt' | 'updatedAt'> & Record<string, unknown> {
  return {
    userId: user.uid,
    userDisplayName: user.displayName,
    userPhotoURL: user.photoURL,
    questId: quest.id,
    questTitle: quest.title,
    questReward: quest.reward,
    questOwnerId: quest.ownerId,
    questOwnerDisplayName: quest.ownerDisplayName,
    questEvidenceType: quest.evidenceType,
    status,
    completionPending: false,
    evidenceData: null,
    evidenceRejected: false,
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getSubscription(
  questId: string,
  userId: string
): Promise<QuestSubscription | null> {
  const snap = await getDoc(subRef(questId, userId))
  if (!snap.exists()) return null
  return snap.data() as QuestSubscription
}

/** Real-time: todas las subscriptions de un quest (para el owner en DetailPage) */
export function subscribeToQuestSubscriptions(
  questId: string,
  callback: (subs: QuestSubscription[]) => void
): () => void {
  const q = query(collection(db, 'sidequests', questId, 'subscriptions'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as QuestSubscription))
  })
}

// ─── Take quest (público) — usa transacción para evitar race conditions ──────

export async function takeQuest(quest: SideQuest, user: UserProfile): Promise<void> {
  await runTransaction(db, async (tx) => {
    const qRef = questRef(quest.id)
    const qSnap = await tx.get(qRef)
    if (!qSnap.exists()) throw new Error('QUEST_NOT_FOUND')

    const data = qSnap.data() as SideQuest
    if (data.status === 'closed') throw new Error('QUEST_CLOSED')
    if (data.maxSubscribers !== null && data.subscribersCount >= data.maxSubscribers) {
      throw new Error('QUEST_FULL')
    }

    const sRef = subRef(quest.id, user.uid)
    const sSnap = await tx.get(sRef)
    if (sSnap.exists()) throw new Error('ALREADY_SUBSCRIBED')

    const newCount = data.subscribersCount + 1
    const willBeFull = data.maxSubscribers !== null && newCount >= data.maxSubscribers

    tx.set(sRef, {
      ...buildSubscriptionData(user, quest, 'active'),
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    tx.update(qRef, {
      subscribersCount: increment(1),
      ...(willBeFull ? { status: 'closed' } : {}),
      updatedAt: serverTimestamp(),
    })
  })

  // Notifica al owner (fuera de la transacción)
  if (quest.ownerId !== user.uid) {
    await createNotification(quest.ownerId, {
      type: 'sidequest_assigned',
      fromUserId: user.uid,
      fromUserDisplayName: user.displayName,
      fromUserPhotoURL: user.photoURL,
      sidequestId: quest.id,
      sidequestTitle: quest.title,
    })
  }
}

// ─── Invite (privado — el owner asigna a un amigo) ───────────────────────────

export async function inviteToQuest(
  quest: SideQuest,
  invitee: UserProfile,
  owner: UserProfile
): Promise<void> {
  const sRef = subRef(quest.id, invitee.uid)

  // Verificar cupo (sin transacción — owner es de confianza, baja concurrencia)
  const existing = await getDoc(sRef)
  if (existing.exists()) throw new Error('ALREADY_SUBSCRIBED')
  if (quest.maxSubscribers !== null && quest.subscribersCount >= quest.maxSubscribers) {
    throw new Error('QUEST_FULL')
  }

  const batch = writeBatch(db)
  batch.set(sRef, {
    ...buildSubscriptionData(invitee, quest, 'pending'),
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.update(questRef(quest.id), {
    subscribersCount: increment(1),
    ...(quest.maxSubscribers !== null && quest.subscribersCount + 1 >= quest.maxSubscribers
      ? { status: 'closed' }
      : {}),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  await createNotification(invitee.uid, {
    type: 'sidequest_assigned',
    fromUserId: owner.uid,
    fromUserDisplayName: owner.displayName,
    fromUserPhotoURL: owner.photoURL,
    sidequestId: quest.id,
    sidequestTitle: quest.title,
  })
}

// ─── Accept / Reject invitation ───────────────────────────────────────────────

export async function acceptSubscription(
  questId: string,
  user: UserProfile,
  ownerId: string,
  questTitle: string
): Promise<void> {
  await updateDoc(subRef(questId, user.uid), {
    status: 'active' as SubscriptionStatus,
    updatedAt: serverTimestamp(),
  })

  await createNotification(ownerId, {
    type: 'sidequest_accepted',
    fromUserId: user.uid,
    fromUserDisplayName: user.displayName,
    fromUserPhotoURL: user.photoURL,
    sidequestId: questId,
    sidequestTitle: questTitle,
  })
}

export async function rejectSubscription(
  questId: string,
  user: UserProfile,
  ownerId: string,
  questTitle: string
): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(subRef(questId, user.uid))
  batch.update(questRef(questId), {
    subscribersCount: increment(-1),
    // Re-abrir el quest si estaba cerrado por estar lleno
    status: 'open',
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  await createNotification(ownerId, {
    type: 'sidequest_rejected',
    fromUserId: user.uid,
    fromUserDisplayName: user.displayName,
    fromUserPhotoURL: user.photoURL,
    sidequestId: questId,
    sidequestTitle: questTitle,
  })
}

// ─── Completion flow ──────────────────────────────────────────────────────────

/** Suscriptor solicita completado (con evidencia opcional) */
export async function requestCompletion(
  questId: string,
  userId: string,
  ownerId: string,
  user: UserProfile,
  questTitle: string,
  evidenceData: string | null = null
): Promise<void> {
  await updateDoc(subRef(questId, userId), {
    completionPending: true,
    evidenceData,
    evidenceRejected: false,
    updatedAt: serverTimestamp(),
  })

  await createNotification(ownerId, {
    type: 'sidequest_completion_requested',
    fromUserId: user.uid,
    fromUserDisplayName: user.displayName,
    fromUserPhotoURL: user.photoURL,
    sidequestId: questId,
    sidequestTitle: questTitle,
  })
}

/** Owner confirma completado de un suscriptor específico */
export async function confirmCompletion(
  quest: import('../types/sidequest').SideQuest,
  subscription: QuestSubscription,
  owner: UserProfile,
  rating: number | null
): Promise<void> {
  const batch = writeBatch(db)

  // 1. Actualizar la subscription
  batch.update(subRef(quest.id, subscription.userId), {
    status: 'complete' as SubscriptionStatus,
    completionPending: false,
    rating,
    updatedAt: serverTimestamp(),
  })

  // 2. Incrementar completedCount del quest
  batch.update(questRef(quest.id), {
    completedCount: increment(1),
    updatedAt: serverTimestamp(),
  })

  // 3. Guardar en el historial de quests completadas del usuario
  const completedQuestRef = doc(db, 'users', subscription.userId, 'completedQuests', quest.id)
  batch.set(completedQuestRef, {
    questId: quest.id,
    questTitle: subscription.questTitle,
    questReward: subscription.questReward,
    questOwnerId: subscription.questOwnerId,
    questOwnerDisplayName: subscription.questOwnerDisplayName,
    tags: quest.tags ?? [],
    evidenceType: subscription.questEvidenceType,
    rating,
    completedAt: serverTimestamp(),
  })

  // 4. Incrementar contador en el perfil del usuario
  batch.update(doc(db, 'users', subscription.userId), {
    completedQuestsCount: increment(1),
  })

  await batch.commit()

  await createNotification(subscription.userId, {
    type: 'sidequest_completed',
    fromUserId: owner.uid,
    fromUserDisplayName: owner.displayName,
    fromUserPhotoURL: owner.photoURL,
    sidequestId: quest.id,
    sidequestTitle: subscription.questTitle,
  })
}

/** Owner rechaza la evidencia — el suscriptor debe reenviar */
export async function rejectEvidence(
  questId: string,
  subscription: QuestSubscription,
  owner: UserProfile
): Promise<void> {
  await updateDoc(subRef(questId, subscription.userId), {
    completionPending: false,
    evidenceData: null,
    evidenceRejected: true,
    updatedAt: serverTimestamp(),
  })

  await createNotification(subscription.userId, {
    type: 'sidequest_evidence_rejected',
    fromUserId: owner.uid,
    fromUserDisplayName: owner.displayName,
    fromUserPhotoURL: owner.photoURL,
    sidequestId: questId,
    sidequestTitle: subscription.questTitle,
  })
}

// ─── Fail / Abandon ───────────────────────────────────────────────────────────

export async function failSubscription(
  questId: string,
  user: UserProfile,
  ownerId: string,
  questTitle: string
): Promise<void> {
  const batch = writeBatch(db)
  batch.update(subRef(questId, user.uid), {
    status: 'failed' as SubscriptionStatus,
    updatedAt: serverTimestamp(),
  })
  batch.update(questRef(questId), {
    failedCount: increment(1),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  if (ownerId !== user.uid) {
    await createNotification(ownerId, {
      type: 'sidequest_failed',
      fromUserId: user.uid,
      fromUserDisplayName: user.displayName,
      fromUserPhotoURL: user.photoURL,
      sidequestId: questId,
      sidequestTitle: questTitle,
    })
  }
}

export async function abandonSubscription(
  questId: string,
  userId: string
): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(subRef(questId, userId))
  batch.update(questRef(questId), {
    subscribersCount: increment(-1),
    status: 'open',
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}

// ─── Real-time hook para el Dashboard ────────────────────────────────────────

/**
 * Escucha todas las subscriptions del usuario actual (activas o pendientes).
 * Usa collectionGroup — requiere index en Firestore.
 */
export function subscribeToUserSubscriptions(
  userId: string,
  callback: (subs: QuestSubscription[]) => void
): () => void {
  const q = query(
    collectionGroup(db, 'subscriptions'),
    where('userId', '==', userId),
    where('status', 'in', ['pending', 'active', 'complete', 'failed']),
    orderBy('joinedAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as QuestSubscription))
  })
}

// ─── Remove Subscriber by Owner ─────────────────────────────────────────────

export async function removeSubscriber(
  questId: string,
  userId: string,
  questTitle: string,
  ownerProfile: UserProfile
): Promise<void> {
  const batch = writeBatch(db)
  batch.delete(subRef(questId, userId))
  batch.update(questRef(questId), {
    subscribersCount: increment(-1),
    status: 'open',
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  // Notify the user that they were removed
  await createNotification(userId, {
    type: 'sidequest_removed',
    fromUserId: ownerProfile.uid,
    fromUserDisplayName: ownerProfile.displayName,
    fromUserPhotoURL: ownerProfile.photoURL,
    sidequestId: questId,
    sidequestTitle: questTitle,
  })
}
