import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  getSidequest,
  assignSidequest,
  acceptAssignment,
  rejectAssignment,
  takeSidequest,
  completeSidequest,
  failSidequest,
  abandonSidequest,
  deleteSidequest,
} from '../firebase/sidequests'
import { getUserProfile } from '../firebase/users'
import { useAuth } from '../hooks/useAuth'
import { useFriends } from '../hooks/useFriends'
import type { SideQuest } from '../types/sidequest'
import type { UserProfile } from '../types/user'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SideQuestStatusBadge } from '../components/sidequests/SideQuestStatusBadge'
import { ExpireCountdown } from '../components/sidequests/ExpireCountdown'
import { AssignModal } from '../components/sidequests/AssignModal'
import { formatDate } from '../utils/formatDate'
import { isExpired } from '../utils/isExpired'
import { toast } from '../components/ui/Toast'

export function SideQuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const { friends } = useFriends()
  const navigate = useNavigate()

  const [quest, setQuest] = useState<SideQuest | null>(null)
  const [assigneeProfile, setAssigneeProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    getSidequest(id).then((q) => {
      setQuest(q)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!quest?.assigneeId) { setAssigneeProfile(null); return }
    getUserProfile(quest.assigneeId).then(setAssigneeProfile)
  }, [quest?.assigneeId])

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" className="text-purple-500" /></div>
  }

  if (!quest) {
    return <div className="p-8 text-center text-gray-400">Quest no encontrada.</div>
  }

  const isOwner = profile?.uid === quest.ownerId
  const isAssignee = profile?.uid === quest.assigneeId
  const expired = isExpired(quest)

  async function withLoading(fn: () => Promise<void>) {
    setActionLoading(true)
    try { await fn() } catch { toast('Ocurrió un error', 'error') } finally { setActionLoading(false) }
  }

  async function handleAssign(assignee: UserProfile) {
    if (!profile) return
    if (assignee.uid === profile.uid) {
      await takeSidequest(quest!, profile)
    } else {
      await assignSidequest(quest!, assignee, profile)
    }
    const updated = await getSidequest(quest!.id)
    setQuest(updated)
    toast(assignee.uid === profile.uid ? '¡Quest asignada a ti mismo!' : `Quest asignada a ${assignee.displayName}`, 'success')
  }

  async function handleAccept() {
    await withLoading(async () => {
      if (!profile) return
      await acceptAssignment(quest!, profile)
      setQuest({ ...quest!, assigneePending: false })
      toast('¡Quest aceptada! Buena suerte.', 'success')
    })
  }

  async function handleReject() {
    await withLoading(async () => {
      if (!profile) return
      await rejectAssignment(quest!, profile)
      navigate('/')
      toast('Quest rechazada', 'info')
    })
  }

  async function handleTake() {
    await withLoading(async () => {
      if (!profile) return
      await takeSidequest(quest!, profile)
      const updated = await getSidequest(quest!.id)
      setQuest(updated)
      toast('¡Quest tomada! A por ella.', 'success')
    })
  }

  async function handleComplete() {
    await withLoading(async () => {
      if (!profile) return
      await completeSidequest(quest!, profile)
      setQuest({ ...quest!, status: 'complete' })
      toast('¡Quest completada! 🎉', 'success')
    })
  }

  async function handleFail() {
    await withLoading(async () => {
      if (!profile) return
      await failSidequest(quest!, profile)
      setQuest({ ...quest!, status: 'failed' })
      toast('Quest marcada como fallada', 'info')
    })
  }

  async function handleAbandon() {
    await withLoading(async () => {
      await abandonSidequest(quest!)
      navigate('/')
      toast('Quest abandonada', 'info')
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

  const canTake = !isOwner && !isAssignee && !quest.assigneeId && quest.visibility === 'public' && quest.status === 'incomplete' && !expired

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
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
            {quest.assigneePending && <Badge variant="purple">Pendiente de aceptación</Badge>}
          </div>
          {isOwner && quest.status === 'incomplete' && (
            <div className="flex gap-2">
              <Link to={`/quests/${quest.id}/edit`} className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-300 hover:border-gray-500 hover:text-white transition-colors">Editar</Link>
              <Button variant="danger" size="sm" loading={actionLoading} onClick={handleDelete}>Eliminar</Button>
            </div>
          )}
        </div>

        <h1 className="mt-3 text-3xl font-bold text-white">{quest.title}</h1>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Descripción</h3>
          <p className="text-gray-200 whitespace-pre-wrap">{quest.description}</p>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Creada por</p>
            <div className="flex items-center gap-2">
              <Avatar src={quest.ownerPhotoURL} name={quest.ownerDisplayName} size="sm" />
              <span className="text-sm text-gray-300">{quest.ownerDisplayName}</span>
            </div>
          </div>

          {quest.assigneeId && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Asignada a</p>
              <div className="flex items-center gap-2">
                <Avatar src={assigneeProfile?.photoURL} name={quest.assigneeDisplayName ?? 'U'} size="sm" />
                <span className="text-sm text-gray-300">{quest.assigneeDisplayName}</span>
                {quest.assigneePending && <span className="text-xs text-purple-400">(pendiente)</span>}
              </div>
            </div>
          )}
        </div>

        {/* Action area */}
        {quest.status === 'incomplete' && !expired && (
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-800">
            {/* Owner actions */}
            {isOwner && !quest.assigneeId && (
              <Button onClick={() => setAssignModalOpen(true)}>Asignar a amigo</Button>
            )}

            {/* Assignee pending actions */}
            {isAssignee && quest.assigneePending && (
              <>
                <Button onClick={handleAccept} loading={actionLoading}>Aceptar Quest</Button>
                <Button variant="secondary" onClick={handleReject} loading={actionLoading}>Rechazar</Button>
              </>
            )}

            {/* Assignee active actions */}
            {isAssignee && !quest.assigneePending && (
              <>
                <Button onClick={handleComplete} loading={actionLoading}>Marcar como completada</Button>
                <Button variant="danger" onClick={handleFail} loading={actionLoading}>Marcar como fallada</Button>
                <Button variant="ghost" onClick={handleAbandon} loading={actionLoading}>Abandonar</Button>
              </>
            )}

            {/* Visitor take action */}
            {canTake && (
              <Button onClick={handleTake} loading={actionLoading}>Tomar Quest</Button>
            )}
          </div>
        )}
      </div>

      {profile && (
        <AssignModal
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          friends={friends}
          currentUser={profile}
          onAssign={handleAssign}
        />
      )}
    </div>
  )
}
