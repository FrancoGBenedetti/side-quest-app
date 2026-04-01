import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  serverTimestamp,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from './config'
import { requestCompletion, confirmCompletion, rejectEvidence } from './subscriptions'
import type { SideQuest } from '../types/sidequest'
import type { QuestSubmission } from '../types/questSubmission'
import type { QuestSubscription } from '../types/subscription'
import type { UserProfile } from '../types/user'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function submissionsCol(questId: string) {
  return collection(db, 'sidequests', questId, 'submissions')
}

function submissionDoc(questId: string, submissionId: string) {
  return doc(db, 'sidequests', questId, 'submissions', submissionId)
}

// ─── Submit evidence ─────────────────────────────────────────────────────────

/**
 * Creates a submission doc (pending) and calls requestCompletion on the
 * subscription so the owner gets notified.
 */
export async function submitEvidence(
  quest: SideQuest,
  user: UserProfile,
  evidenceText: string | null,
  evidenceImageUrl: string | null
): Promise<void> {
  // 1. Create the submission
  await addDoc(submissionsCol(quest.id), {
    userId: user.uid,
    userDisplayName: user.displayName,
    userPhotoURL: user.photoURL,
    evidenceText,
    evidenceImageUrl,
    status: 'pending',
    rating: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // 2. Mark subscription as completionPending (notifies owner)
  const evidenceData = evidenceText ?? evidenceImageUrl ?? null
  await requestCompletion(
    quest.id,
    user.uid,
    quest.ownerId,
    user,
    quest.title,
    evidenceData
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export interface SubmissionsPage {
  items: QuestSubmission[]
  lastDoc: DocumentSnapshot | null
  hasMore: boolean
}

export async function getSubmissions(
  questId: string,
  pageSize = PAGE_SIZE
): Promise<SubmissionsPage> {
  const q = query(
    submissionsCol(questId),
    orderBy('createdAt', 'desc'),
    limit(pageSize + 1)
  )
  const snap = await getDocs(q)
  const hasMore = snap.docs.length > pageSize
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs
  return {
    items: docs.map((d) => ({ id: d.id, ...d.data() } as QuestSubmission)),
    lastDoc: docs.at(-1) ?? null,
    hasMore,
  }
}

export async function getMoreSubmissions(
  questId: string,
  lastDoc: DocumentSnapshot,
  pageSize = PAGE_SIZE
): Promise<SubmissionsPage> {
  const q = query(
    submissionsCol(questId),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(pageSize + 1)
  )
  const snap = await getDocs(q)
  const hasMore = snap.docs.length > pageSize
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs
  return {
    items: docs.map((d) => ({ id: d.id, ...d.data() } as QuestSubmission)),
    lastDoc: docs.at(-1) ?? null,
    hasMore,
  }
}

// ─── Check active submission ──────────────────────────────────────────────────

/** Returns the user's most recent pending/complete submission if any. */
export async function getUserActiveSubmission(
  questId: string,
  userId: string
): Promise<QuestSubmission | null> {
  const q = query(
    submissionsCol(questId),
    where('userId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() } as QuestSubmission
}

// ─── Owner: approve / reject ──────────────────────────────────────────────────

export async function approveSubmission(
  quest: SideQuest,
  submission: QuestSubmission,
  subscription: QuestSubscription,
  owner: UserProfile,
  rating: number | null
): Promise<void> {
  // 1. Update submission status
  await updateDoc(submissionDoc(quest.id, submission.id), {
    status: 'complete',
    rating,
    updatedAt: serverTimestamp(),
  })

  // 2. Confirm completion on subscription (batch: subscription + completedQuests + counters)
  await confirmCompletion(quest, subscription, owner, rating)
}

export async function rejectSubmissionEvidence(
  questId: string,
  submission: QuestSubmission,
  subscription: QuestSubscription,
  owner: UserProfile
): Promise<void> {
  // 1. Mark submission as failed (stays visible in thread as a failed attempt)
  await updateDoc(submissionDoc(questId, submission.id), {
    status: 'failed',
    updatedAt: serverTimestamp(),
  })

  // 2. Reject evidence on subscription (owner can re-submit)
  await rejectEvidence(questId, subscription, owner)
}
