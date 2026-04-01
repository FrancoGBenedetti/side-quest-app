import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSidequest, closeSidequest, reopenSidequest, deleteSidequest } from '../../firebase/sidequests'
import {
  getSubscription,
  subscribeToQuestSubscriptions,
  takeQuest,
  inviteToQuest,
  acceptSubscription,
  rejectSubscription,
  failSubscription,
  abandonSubscription,
  removeSubscriber,
} from '../../firebase/subscriptions'
import { useAuth } from '../../hooks/useAuth'
import { useFriends } from '../../hooks/useFriends'
import type { SideQuest } from '../../types/sidequest'
import type { QuestSubscription } from '../../types/subscription'
import type { UserProfile } from '../../types/user'
import { Spinner } from '../ui/Spinner'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Avatar } from '../ui/Avatar'
import { SideQuestStatusBadge, SubscriptionStatusBadge } from './SideQuestStatusBadge'
import { ExpireCountdown } from './ExpireCountdown'
import { AssignModal } from './AssignModal'
import { SubmissionThread } from './SubmissionThread'
import { toast } from '../ui/Toast'
import { formatDate } from '../../utils/formatDate'
import { isExpired } from '../../utils/isExpired'
import { QUEST_CATEGORY_MAP } from '../../constants/questCategories'
import { cn } from '../../utils/cn'

interface Props {
  /** If provided, the modal fetches the quest by ID. */
  questId: string
  /** If provided, starts with this quest data (avoids initial fetch). */
  initialQuest?: SideQuest
  onClose: () => void
  /** True when rendered as standalone page (no overlay, fills container) */
  isStandalone?: boolean
}

export function SidequestModal({ questId, initialQuest, onClose, isStandalone = false }: Props) {
  const { profile } = useAuth()
  const { friends } = useFriends()
  const navigate = useNavigate()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [quest, setQuest] = useState<SideQuest | null>(initialQuest ?? null)
  const [mySubscription, setMySubscription] = useState<QuestSubscription | null>(null)
  const [allSubscriptions, setAllSubscriptions] = useState<QuestSubscription[]>([])
  const [loading, setLoading] = useState(!initialQuest)
  const [actionLoading, setActionLoading] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  // ── Load quest ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialQuest) return
    setLoading(true)
    getSidequest(questId).then((q) => {
      setQuest(q)
      setLoading(false)
    })
  }, [questId])

  // ── Load my subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!profile) return
    getSubscription(questId, profile.uid).then(setMySubscription)
  }, [questId, profile?.uid])

  // ── Owner: real-time subscriptions ───────────────────────────────────────
  useEffect(() => {
    if (!quest || !profile || profile.uid !== quest.ownerId) return
    return subscribeToQuestSubscriptions(questId, setAllSubscriptions)
  }, [questId, quest?.ownerId, profile?.uid])

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // ── Helpers ───────────────────────────────────────────────────────────────

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
    const updated = await getSidequest(questId)
    setQuest(updated)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleTake() {
    await withLoading(async () => {
      await takeQuest(quest!, profile!)
      await refreshQuest()
      const sub = await getSubscription(questId, profile!.uid)
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
      const sub = await getSubscription(questId, profile!.uid)
      setMySubscription(sub)
    }
  }

  async function handleAccept() {
    await withLoading(async () => {
      await acceptSubscription(questId, profile!, quest!.ownerId, quest!.title)
      setMySubscription((s) => s ? { ...s, status: 'active' } : s)
      toast('¡Quest aceptada! Buena suerte.', 'success')
    })
  }

  async function handleRejectInvite() {
    await withLoading(async () => {
      await rejectSubscription(questId, profile!, quest!.ownerId, quest!.title)
      setMySubscription(null)
      await refreshQuest()
      onClose()
      toast('Invitación rechazada', 'info')
    })
  }

  async function handleFail() {
    await withLoading(async () => {
      await failSubscription(questId, profile!, quest!.ownerId, quest!.title)
      setMySubscription((s) => s ? { ...s, status: 'failed' } : s)
      await refreshQuest()
      toast('Quest marcada como fallada', 'info')
    })
  }

  async function handleAbandon() {
    await withLoading(async () => {
      await abandonSubscription(questId, profile!.uid)
      setMySubscription(null)
      await refreshQuest()
      onClose()
      toast('Quest abandonada', 'info')
    })
  }

  async function handleClose() {
    if (!confirm('¿Cerrar esta quest? Ya nadie podrá suscribirse. Puedes reabrirla después.')) return
    await withLoading(async () => {
      await closeSidequest(questId)
      await refreshQuest()
      toast('Quest cerrada', 'info')
    })
  }

  async function handleReopen() {
    await withLoading(async () => {
      await reopenSidequest(questId)
      await refreshQuest()
      toast('Quest reabierta', 'success')
    })
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta quest? Esta acción no se puede deshacer.')) return
    await withLoading(async () => {
      await deleteSidequest(questId)
      onClose()
      navigate('/')
      toast('Quest eliminada', 'info')
    })
  }

  async function handleRemoveSubscriber(subscriberId: string) {
    if (!confirm('¿Seguro quieres eliminar a este suscriptor de la quest?')) return
    await withLoading(async () => {
      await removeSubscriber(questId, subscriberId, quest!.title, profile!)
      await refreshQuest()
      toast('Suscriptor eliminado', 'info')
    })
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const isOwner = profile?.uid === quest?.ownerId
  const expired = quest ? isExpired(quest) : false
  const isFull = quest?.maxSubscribers !== null && (quest?.subscribersCount ?? 0) >= (quest?.maxSubscribers ?? Infinity)
  const canTake = !isOwner && !mySubscription && quest?.status === 'open' && !expired
  const existingSubscriberIds = allSubscriptions.map((s) => s.userId)

  // ── Content ───────────────────────────────────────────────────────────────

  const modalContent = (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* ── Left panel: info + actions ── */}
      <div className="lg:w-[35%] flex flex-col gap-5 overflow-y-auto p-5 lg:border-r lg:border-gray-800">
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Spinner size="lg" className="text-purple-500" />
          </div>
        ) : !quest ? (
          <p className="text-gray-400 text-sm">Quest no encontrada.</p>
        ) : (
          <>
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <SideQuestStatusBadge status={quest.status} />
              {quest.visibility === 'public' && <Badge variant="blue">Pública</Badge>}
              {mySubscription && <SubscriptionStatusBadge status={mySubscription.status} />}
              {mySubscription?.completionPending && (
                <Badge variant="warning">Esperando validación</Badge>
              )}
              {mySubscription?.evidenceRejected && !mySubscription.completionPending && (
                <Badge variant="danger">Evidencia rechazada</Badge>
              )}
            </div>

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-white leading-snug">{quest.title}</h2>
              <p className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{quest.description}</p>
            </div>

            {/* Tags */}
            {quest.tags && quest.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {quest.tags.map((tagId) => {
                  const cat = QUEST_CATEGORY_MAP[tagId]
                  if (!cat) return null
                  return (
                    <span
                      key={tagId}
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        cat.badgeClass
                      )}
                    >
                      {cat.emoji} {cat.label}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Reward + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <p className="text-xs text-gray-500 mb-1">Recompensa</p>
                <p className="text-sm text-yellow-400 font-medium flex items-center gap-1">
                  <span>🏆</span> {quest.reward}
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <p className="text-xs text-gray-500 mb-1">Tiempo</p>
                <ExpireCountdown quest={quest} />
                {!quest.isEternal && quest.expiresAt && (
                  <p className="text-xs text-gray-500 mt-1">{formatDate(quest.expiresAt)}</p>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-2.5 text-center">
                <p className="text-base font-bold text-white">
                  {quest.subscribersCount}
                  {quest.maxSubscribers !== null && (
                    <span className="text-xs text-gray-500">/{quest.maxSubscribers}</span>
                  )}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Suscriptores</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-2.5 text-center">
                <p className="text-base font-bold text-green-400">{quest.completedCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Completados</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-2.5 text-center">
                <p className="text-base font-bold text-red-400">{quest.failedCount}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Fallados</p>
              </div>
            </div>

            {/* Owner info */}
            <div className="flex items-center gap-2">
              <Avatar src={quest.ownerPhotoURL} name={quest.ownerDisplayName} size="sm" />
              <div>
                <p className="text-xs text-gray-500">Creada por</p>
                <p className="text-sm text-gray-300">{quest.ownerDisplayName}</p>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="border-t border-gray-800 pt-4 flex flex-col gap-3">
              {/* Closed banner */}
              {quest.status === 'closed' && !mySubscription && !isOwner && (
                <p className="text-xs text-gray-500 rounded-lg border border-gray-700 px-3 py-2">
                  Esta quest está cerrada. No se aceptan nuevos suscriptores.
                </p>
              )}

              {!expired && (
                <div className="flex flex-wrap gap-2">
                  {canTake && !isFull && (
                    <Button onClick={handleTake} loading={actionLoading} className="w-full">
                      Tomar Quest
                    </Button>
                  )}
                  {canTake && isFull && (
                    <p className="text-sm text-gray-500 italic">Esta quest está llena.</p>
                  )}

                  {mySubscription?.status === 'pending' && (
                    <>
                      <Button onClick={handleAccept} loading={actionLoading} className="flex-1">
                        Aceptar
                      </Button>
                      <Button variant="secondary" onClick={handleRejectInvite} loading={actionLoading} className="flex-1">
                        Rechazar
                      </Button>
                    </>
                  )}

                  {mySubscription?.status === 'active' && (
                    <>
                      <Button variant="danger" onClick={handleFail} loading={actionLoading}>
                        Fallar
                      </Button>
                      <Button variant="ghost" onClick={handleAbandon} loading={actionLoading}>
                        Abandonar
                      </Button>
                    </>
                  )}

                  {isOwner && quest.status === 'open' && !isFull && (
                    <Button variant="secondary" onClick={() => setAssignModalOpen(true)} className="w-full">
                      Asignar a alguien
                    </Button>
                  )}
                </div>
              )}

              {/* Owner controls */}
              {isOwner && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    to={`/quests/${quest.id}/edit`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
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

            {/* Owner: subscriber list */}
            {isOwner && allSubscriptions.length > 0 && (
              <div className="border-t border-gray-800 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Suscriptores ({allSubscriptions.length})
                </p>
                <ul className="flex flex-col gap-1.5">
                  {allSubscriptions.map((sub) => (
                    <li key={sub.userId} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 p-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar src={sub.userPhotoURL} name={sub.userDisplayName} size="sm" />
                        <span className="text-sm text-gray-300 truncate max-w-[90px]">{sub.userDisplayName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SubscriptionStatusBadge status={sub.status} />
                        <button
                          onClick={() => handleRemoveSubscriber(sub.userId)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                          disabled={actionLoading}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Right panel: submission thread ── */}
      <div className="flex-1 overflow-hidden flex flex-col p-5 min-h-[300px]">
        {quest && (
          <SubmissionThread
            quest={quest}
            currentUser={profile ?? null}
            mySubscription={mySubscription}
            allSubscriptions={allSubscriptions}
            isOwner={isOwner}
          />
        )}
      </div>
    </div>
  )

  // ── Standalone mode (used in SideQuestDetailPage) ─────────────────────────
  if (isStandalone) {
    return (
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-xl h-[90vh] overflow-hidden">
        {modalContent}
      </div>
    )
  }

  // ── Modal overlay ─────────────────────────────────────────────────────────
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="relative w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-xl h-[90vh] overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {modalContent}
      </div>

      {/* AssignModal lives outside the main panel */}
      {quest && profile && (
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
    </div>
  )
}
