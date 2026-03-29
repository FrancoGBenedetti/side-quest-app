import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getSidequest, deleteSidequest, closeSidequest, reopenSidequest } from '../firebase/sidequests'
import {
  getSubscription,
  subscribeToQuestSubscriptions,
  takeQuest,
  inviteToQuest,
  acceptSubscription,
  rejectSubscription,
  requestCompletion,
  confirmCompletion,
  rejectEvidence,
  failSubscription,
  abandonSubscription,
  removeSubscriber,
} from '../firebase/subscriptions'
import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'
import type { SideQuest } from '../types/sidequest'
import type { QuestSubscription } from '../types/subscription'
import type { UserProfile } from '../types/user'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SideQuestStatusBadge, SubscriptionStatusBadge } from '../components/sidequests/SideQuestStatusBadge'
import { ExpireCountdown } from '../components/sidequests/ExpireCountdown'
import { AssignModal } from '../components/sidequests/AssignModal'
import { CompleteModal } from '../components/sidequests/CompleteModal'
import { ValidateModal } from '../components/sidequests/ValidateModal'
import { formatDate } from '../utils/formatDate'
import { isExpired } from '../utils/isExpired'
import { toast } from '../components/ui/Toast'
import { QUEST_CATEGORY_MAP } from '../constants/questCategories'
import { cn } from '../utils/cn'

const evidenceLabels = {
  none: null,
  text: 'Requiere evidencia · Texto',
  photo: 'Requiere evidencia · Foto',
}

export function SideQuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { friends } = useFriends()
  const navigate = useNavigate()

  const [quest, setQuest] = useState<SideQuest | null>(null)
  const [mySubscription, setMySubscription] = useState<QuestSubscription | null>(null)
  const [allSubscriptions, setAllSubscriptions] = useState<QuestSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [validateTarget, setValidateTarget] = useState<QuestSubscription | null>(null)

  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)

  // ── Cargar quest ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return
    getSidequest(id).then((q) => {
      setQuest(q)
      setLoading(false)
    })
  }, [id])

  // ── Cargar mi subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id || !profile) return
    getSubscription(id, profile.uid).then(setMySubscription)
  }, [id, profile?.uid])

  // ── Escuchar todas las subscriptions (solo owner) ───────────────────────────
  useEffect(() => {
    if (!id || !quest || !profile || profile.uid !== quest.ownerId) return
    return subscribeToQuestSubscriptions(id, setAllSubscriptions)
  }, [id, quest?.ownerId, profile?.uid])

  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" className="text-purple-500" /></div>
  }

  if (!quest) {
    return <div className="p-8 text-center text-gray-400">Quest no encontrada.</div>
  }

  const isOwner = profile?.uid === quest.ownerId
  const expired = isExpired(quest)
  const isFull = quest.maxSubscribers !== null && quest.subscribersCount >= quest.maxSubscribers
  const canTake = !isOwner && !mySubscription && quest.status === 'open' && !expired

  const existingSubscriberIds = allSubscriptions.map((s) => s.userId)

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function withLoading(fn: () => Promise<void>) {
    setActionLoading(true)
    try {
      await fn()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'QUEST_FULL') toast('La quest ya no tiene cupos disponibles', 'error')
      else if (msg === 'ALREADY_SUBSCRIBED') toast('Ya estás suscrito a esta quest', 'error')
      else if (msg === 'QUEST_CLOSED') toast('Esta quest está cerrada', 'error')
      else toast('Ocurrió un error', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function refreshQuest() {
    const updated = await getSidequest(quest!.id)
    setQuest(updated)
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleTake() {
    await withLoading(async () => {
      await takeQuest(quest!, profile!)
      await refreshQuest()
      const sub = await getSubscription(quest!.id, profile!.uid)
      setMySubscription(sub)
      toast('¡Quest tomada! A por ella.', 'success')
    })
  }

  async function handleInvite(user: UserProfile) {
    const isSelf = user.uid === profile!.uid
    await inviteToQuest(quest!, user, profile!)
    await refreshQuest()
    toast(
      isSelf ? '¡Quest asignada a ti mismo!' : `Quest asignada a ${user.displayName}`,
      'success'
    )
    if (isSelf) {
      const sub = await getSubscription(quest!.id, profile!.uid)
      setMySubscription(sub)
    }
  }

  async function handleAccept() {
    await withLoading(async () => {
      await acceptSubscription(quest!.id, profile!, quest!.ownerId, quest!.title)
      setMySubscription((s) => s ? { ...s, status: 'active' } : s)
      toast('¡Quest aceptada! Buena suerte.', 'success')
    })
  }

  async function handleRejectInvite() {
    await withLoading(async () => {
      await rejectSubscription(quest!.id, profile!, quest!.ownerId, quest!.title)
      setMySubscription(null)
      await refreshQuest()
      navigate('/')
      toast('Invitación rechazada', 'info')
    })
  }

  async function handleRequestCompletion(evidenceData: string | null) {
    await requestCompletion(quest!.id, profile!.uid, quest!.ownerId, profile!, quest!.title, evidenceData)
    const sub = await getSubscription(quest!.id, profile!.uid)
    setMySubscription(sub)
    setCompleteModalOpen(false)
    toast('Evidencia enviada. Esperando confirmación del owner.', 'success')
  }

  async function handleConfirmCompletion(rating: number | null) {
    if (!validateTarget) return
    await confirmCompletion(quest!, validateTarget, profile!, rating)
    await refreshQuest()
    setValidateTarget(null)
    toast('¡Completado confirmado! 🎉', 'success')
  }

  async function handleRejectEvidence() {
    if (!validateTarget) return
    await rejectEvidence(quest!.id, validateTarget, profile!)
    setValidateTarget(null)
    toast('Evidencia rechazada. El suscriptor debe reenviar.', 'info')
  }

  async function handleFail() {
    await withLoading(async () => {
      await failSubscription(quest!.id, profile!, quest!.ownerId, quest!.title)
      setMySubscription((s) => s ? { ...s, status: 'failed' } : s)
      await refreshQuest()
      toast('Quest marcada como fallada', 'info')
    })
  }

  async function handleAbandon() {
    await withLoading(async () => {
      await abandonSubscription(quest!.id, profile!.uid)
      setMySubscription(null)
      await refreshQuest()
      navigate('/')
      toast('Quest abandonada', 'info')
    })
  }

  async function handleClose() {
    if (!confirm('¿Cerrar esta quest? Ya nadie podrá suscribirse. Puedes reabrirla después.')) return
    await withLoading(async () => {
      await closeSidequest(quest!.id)
      await refreshQuest()
      toast('Quest cerrada', 'info')
    })
  }

  async function handleReopen() {
    await withLoading(async () => {
      await reopenSidequest(quest!.id)
      await refreshQuest()
      toast('Quest reabierta', 'success')
    })
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta quest? Esta acción no se puede deshacer.')) return
    await withLoading(async () => {
      await deleteSidequest(quest!.id)
      navigate('/')
      toast('Quest eliminada', 'info')
    })
  }

  async function handleRemoveSubscriber(subscriberId: string) {
    if (!confirm('¿Seguro quieres eliminar a este suscriptor de la quest?')) return
    await withLoading(async () => {
      await removeSubscriber(quest!.id, subscriberId, quest!.title, profile!)
      await refreshQuest()
      toast('Suscriptor eliminado', 'info')
    })
  }

  // ── Subscription cuyo completionPending === true (para el owner) ─────────────
  const pendingCompletions = allSubscriptions.filter((s) => s.completionPending)

  // ── Construcción del CompleteModal proxy que adapta la interfaz ──────────────
  // CompleteModal espera un SideQuest con evidenceType y campos de evidencia.
  // Los campos de evidencia están ahora en la subscription.
  const questForCompleteModal = {
    ...quest,
    evidenceRejected: mySubscription?.evidenceRejected ?? false,
    evidenceData: mySubscription?.evidenceData ?? null,
  }

  // ValidateModal necesita la evidencia de la subscription seleccionada
  const questForValidateModal = validateTarget
    ? {
        ...quest,
        evidenceData: validateTarget.evidenceData,
        evidenceRejected: validateTarget.evidenceRejected,
        completionPending: validateTarget.completionPending,
      }
    : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* ── Back ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <SideQuestStatusBadge status={quest.status} />
            {quest.visibility === 'public' && <Badge variant="blue">Pública</Badge>}
            {mySubscription && <SubscriptionStatusBadge status={mySubscription.status} />}
            {mySubscription?.completionPending && <Badge variant="warning">Esperando validación</Badge>}
            {mySubscription?.evidenceRejected && !mySubscription.completionPending && (
              <Badge variant="danger">Evidencia rechazada</Badge>
            )}
          </div>
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Link
                to={`/quests/${quest.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
              >
                Editar
              </Link>
              {quest.status === 'open' ? (
                <Button variant="secondary" size="sm" loading={actionLoading} onClick={handleClose}>
                  Cerrar Quest
                </Button>
              ) : (
                <Button variant="secondary" size="sm" loading={actionLoading} onClick={handleReopen}>
                  Reabrir
                </Button>
              )}
              <Button variant="danger" size="sm" loading={actionLoading} onClick={handleDelete}>
                Eliminar
              </Button>
            </div>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-bold text-white">{quest.title}</h1>
      </div>

      {/* ── Main card ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Descripción</h3>
          <p className="text-gray-200 whitespace-pre-wrap">{quest.description}</p>
        </div>

        {/* Reward + Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-xs text-gray-500 mb-1">Recompensa</p>
            <p className="text-sm text-yellow-400 font-medium flex items-center gap-1">
              <span>🏆</span> {quest.reward}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-xs text-gray-500 mb-1">Tiempo</p>
            <ExpireCountdown quest={quest} />
            {!quest.isEternal && quest.expiresAt && (
              <p className="text-xs text-gray-500 mt-1">Expira: {formatDate(quest.expiresAt)}</p>
            )}
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-center">
            <p className="text-lg font-bold text-white">
              {quest.subscribersCount}
              {quest.maxSubscribers !== null && (
                <span className="text-sm text-gray-500">/{quest.maxSubscribers}</span>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Suscriptores</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-center">
            <p className="text-lg font-bold text-green-400">{quest.completedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completados</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-center">
            <p className="text-lg font-bold text-red-400">{quest.failedCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">Fallados</p>
          </div>
        </div>

        {/* Evidence type */}
        {evidenceLabels[quest.evidenceType] && (
          <div className="rounded-xl border border-purple-900/50 bg-purple-950/20 px-4 py-3 flex items-center gap-2">
            <svg className="h-4 w-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-purple-300">{evidenceLabels[quest.evidenceType]}</p>
          </div>
        )}

        {/* Tags */}
        {quest.tags && quest.tags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Categorías</h3>
            <div className="flex flex-wrap gap-2">
              {quest.tags.map((tagId) => {
                const cat = QUEST_CATEGORY_MAP[tagId]
                if (!cat) return null
                return (
                  <span
                    key={tagId}
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                      cat.badgeClass
                    )}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Owner info */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Creada por</p>
          <div className="flex items-center gap-2">
            <Avatar src={quest.ownerPhotoURL} name={quest.ownerDisplayName} size="sm" />
            <span className="text-sm text-gray-300">{quest.ownerDisplayName}</span>
          </div>
        </div>

        {/* ── Action area ─────────────────────────────────────────────────── */}
        {quest.status === 'closed' && !mySubscription && !isOwner && (
          <div className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
            <svg className="h-4 w-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-gray-400">Esta quest está cerrada. No se aceptan nuevos suscriptores.</p>
          </div>
        )}

        {!expired && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-800">
            {/* Visitor: tomar quest pública */}
            {canTake && !isFull && (
              <Button onClick={handleTake} loading={actionLoading}>Tomar Quest</Button>
            )}
            {canTake && isFull && (
              <p className="text-sm text-gray-500 italic">Esta quest está llena.</p>
            )}

            {/* Subscription: pendiente de aceptar */}
            {mySubscription?.status === 'pending' && (
              <>
                <Button onClick={handleAccept} loading={actionLoading}>Aceptar Quest</Button>
                <Button variant="secondary" onClick={handleRejectInvite} loading={actionLoading}>Rechazar</Button>
              </>
            )}

            {/* Subscription: activa */}
            {mySubscription?.status === 'active' && (
              <>
                {!mySubscription.completionPending && (
                  <Button onClick={() => setCompleteModalOpen(true)}>
                    {mySubscription.evidenceRejected ? 'Reenviar evidencia' : 'Completar'}
                  </Button>
                )}
                <Button variant="danger" onClick={handleFail} loading={actionLoading}>Fallar</Button>
                <Button variant="ghost" onClick={handleAbandon} loading={actionLoading}>Abandonar</Button>
              </>
            )}

            {/* Owner: asignar (solo si la quest está abierta) */}
            {isOwner && quest.status === 'open' && !isFull && (
              <Button variant="secondary" onClick={() => setAssignModalOpen(true)}>
                Asignar a alguien
              </Button>
            )}
          </div>
        )}

        {/* ── Owner: completions pendientes de validar ─────────────────────── */}
        {isOwner && pendingCompletions.length > 0 && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Pendientes de validación ({pendingCompletions.length})
            </p>
            <ul className="flex flex-col gap-2">
              {pendingCompletions.map((sub) => (
                <li key={sub.userId} className="flex items-center justify-between gap-3 rounded-lg border border-yellow-800/50 bg-yellow-950/10 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={sub.userPhotoURL} name={sub.userDisplayName} size="sm" />
                    <span className="text-sm text-gray-300">{sub.userDisplayName}</span>
                  </div>
                  <Button size="sm" onClick={() => setValidateTarget(sub)}>Validar</Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Owner: lista de todos los suscriptores ─────────────────────── */}
        {isOwner && allSubscriptions.length > 0 && (
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Suscriptores ({allSubscriptions.length})
            </p>
            <ul className="flex flex-col gap-2">
              {allSubscriptions.map((sub) => (
                <li key={sub.userId} className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 p-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={sub.userPhotoURL} name={sub.userDisplayName} size="sm" />
                    <span className="text-sm text-gray-300">{sub.userDisplayName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SubscriptionStatusBadge status={sub.status} />
                    <button
                      onClick={() => handleRemoveSubscriber(sub.userId)}
                      className="text-gray-500 hover:text-red-400 focus:outline-none transition-colors"
                      title="Eliminar suscriptor"
                      disabled={actionLoading}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────────── */}
      {profile && (
        <AssignModal
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          quest={quest}
          friends={friends}
          currentUser={profile}
          existingSubscriberIds={existingSubscriberIds}
          onAssign={handleInvite}
        />
      )}

      <CompleteModal
        open={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        quest={questForCompleteModal as Parameters<typeof CompleteModal>[0]['quest']}
        onSubmit={handleRequestCompletion}
      />

      {questForValidateModal && (
        <ValidateModal
          open={validateTarget !== null}
          onClose={() => setValidateTarget(null)}
          quest={questForValidateModal as Parameters<typeof ValidateModal>[0]['quest']}
          onConfirm={handleConfirmCompletion}
          onReject={handleRejectEvidence}
        />
      )}
    </div>
  )
}
