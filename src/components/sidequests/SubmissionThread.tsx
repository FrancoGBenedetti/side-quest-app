import { useEffect, useState } from 'react'
import {
  getSubmissions,
  getMoreSubmissions,
  submitEvidence,
  approveSubmission,
  rejectSubmissionEvidence,
  getUserActiveSubmission,
} from '../../firebase/submissions'
import type { SideQuest } from '../../types/sidequest'
import type { QuestSubmission } from '../../types/questSubmission'
import type { QuestSubscription } from '../../types/subscription'
import type { UserProfile } from '../../types/user'
import type { DocumentSnapshot } from 'firebase/firestore'
import { SubmissionItem } from './SubmissionItem'
import { SubmissionForm } from './SubmissionForm'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { toast } from '../ui/Toast'

interface Props {
  quest: SideQuest
  currentUser: UserProfile | null
  /** The current user's subscription (needed to allow submitting) */
  mySubscription: QuestSubscription | null
  /** All subscriptions — passed by owner so we can find each submitter's subscription */
  allSubscriptions: QuestSubscription[]
  isOwner: boolean
}

export function SubmissionThread({
  quest,
  currentUser,
  mySubscription,
  allSubscriptions,
  isOwner,
}: Props) {
  const [items, setItems] = useState<QuestSubmission[]>([])
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [hasPending, setHasPending] = useState(false)

  // Initial load
  useEffect(() => {
    setLoading(true)
    getSubmissions(quest.id).then((page) => {
      setItems(page.items)
      setLastDoc(page.lastDoc)
      setHasMore(page.hasMore)
      setLoading(false)
    })
  }, [quest.id])

  // Check if current user already has a pending submission
  useEffect(() => {
    if (!currentUser || !mySubscription || mySubscription.status !== 'active') return
    getUserActiveSubmission(quest.id, currentUser.uid).then((sub) => {
      setHasPending(sub !== null)
    })
  }, [quest.id, currentUser?.uid, mySubscription?.status])

  async function loadMore() {
    if (!lastDoc) return
    setLoadingMore(true)
    const page = await getMoreSubmissions(quest.id, lastDoc)
    setItems((prev) => [...prev, ...page.items])
    setLastDoc(page.lastDoc)
    setHasMore(page.hasMore)
    setLoadingMore(false)
  }

  async function handleSubmit(evidenceText: string | null, evidenceImageUrl: string | null) {
    if (!currentUser) return
    try {
      await submitEvidence(quest, currentUser, evidenceText, evidenceImageUrl)
      toast('Evidencia enviada. Esperando confirmación del owner.', 'success')
      setShowForm(false)
      setHasPending(true)
      // Reload first page
      const page = await getSubmissions(quest.id)
      setItems(page.items)
      setLastDoc(page.lastDoc)
      setHasMore(page.hasMore)
    } catch (err) {
      console.error('Error al enviar evidencia:', err)
      toast('Error al enviar la evidencia. Verifica tu conexión e intenta de nuevo.', 'error')
      throw err // Re-throw so SubmissionForm's finally runs correctly
    }
  }

  async function handleApprove(submission: QuestSubmission, rating: number | null) {
    if (!currentUser) return
    const subscription = allSubscriptions.find((s) => s.userId === submission.userId) ?? null
    if (!subscription) {
      toast('No se encontró la subscripción del usuario', 'error')
      return
    }
    await approveSubmission(quest, submission, subscription, currentUser, rating)
    toast('¡Completado confirmado! 🎉', 'success')
    setItems((prev) =>
      prev.map((s) => (s.id === submission.id ? { ...s, status: 'complete', rating } : s))
    )
  }

  async function handleReject(submission: QuestSubmission) {
    if (!currentUser) return
    const subscription = allSubscriptions.find((s) => s.userId === submission.userId) ?? null
    if (!subscription) {
      toast('No se encontró la subscripción del usuario', 'error')
      return
    }
    await rejectSubmissionEvidence(quest.id, submission, subscription, currentUser)
    toast('Evidencia rechazada. El suscriptor puede reenviar.', 'info')
    setItems((prev) =>
      prev.map((s) => (s.id === submission.id ? { ...s, status: 'failed' } : s))
    )
  }

  const canSubmit =
    currentUser &&
    mySubscription?.status === 'active' &&
    !mySubscription.completionPending &&
    !hasPending

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Submissions
        </h3>
        {canSubmit && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Enviar respuesta
          </Button>
        )}
        {mySubscription?.completionPending && !showForm && (
          <span className="text-xs text-yellow-400">Esperando validación del owner</span>
        )}
        {hasPending && !mySubscription?.completionPending && !showForm && (
          <span className="text-xs text-yellow-400">Tienes una submission pendiente</span>
        )}
      </div>

      {/* Submission form */}
      {showForm && currentUser && (
        <div className="mb-4 flex-shrink-0">
          <SubmissionForm
            quest={quest}
            questId={quest.id}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-purple-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 text-sm text-gray-600">
            Aún no hay submissions para esta quest.
          </div>
        ) : (
          items.map((submission) => {
            const subscription = allSubscriptions.find((s) => s.userId === submission.userId) ?? null
            return (
              <SubmissionItem
                key={submission.id}
                submission={submission}
                subscription={subscription}
                isOwner={isOwner}
                onApprove={isOwner ? handleApprove : undefined}
                onReject={isOwner ? handleReject : undefined}
              />
            )
          })
        )}

        {hasMore && (
          <div className="text-center pt-2">
            <Button size="sm" variant="ghost" loading={loadingMore} onClick={loadMore}>
              Cargar más
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
