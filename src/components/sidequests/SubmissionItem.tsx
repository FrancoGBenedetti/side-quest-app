import { useState } from 'react'
import type { QuestSubmission } from '../../types/questSubmission'
import type { QuestSubscription } from '../../types/subscription'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'
import { formatRelative } from '../../utils/formatDate'

interface Props {
  submission: QuestSubmission
  /** Subscription of the submitter — needed for owner approve/reject */
  subscription: QuestSubscription | null
  isOwner: boolean
  onApprove?: (submission: QuestSubmission, rating: number | null) => Promise<void>
  onReject?: (submission: QuestSubmission) => Promise<void>
}

function StarPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hovered ?? value ?? 0) >= star
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(value === star ? null : star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            className="text-yellow-400 hover:scale-110 transition-transform"
          >
            <svg className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} className={cn('h-3.5 w-3.5', star <= value ? 'text-yellow-400' : 'text-gray-600')} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  )
}

const statusConfig = {
  pending: { label: '⏳ Pendiente', className: 'bg-yellow-900/40 text-yellow-300 border border-yellow-800/50' },
  complete: { label: '✅ Aprobado', className: 'bg-green-900/40 text-green-300 border border-green-800/50' },
  failed: { label: '❌ Rechazado', className: 'bg-red-900/40 text-red-300 border border-red-800/50' },
}

export function SubmissionItem({ submission, subscription, isOwner, onApprove, onReject }: Props) {
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rating, setRating] = useState<number | null>(null)
  const [showApprovePanel, setShowApprovePanel] = useState(false)

  const cfg = statusConfig[submission.status]
  const canAct = isOwner && submission.status === 'pending' && subscription && onApprove && onReject

  async function handleApprove() {
    if (!onApprove) return
    setApproving(true)
    try {
      await onApprove(submission, rating)
      setShowApprovePanel(false)
    } finally {
      setApproving(false)
    }
  }

  async function handleReject() {
    if (!onReject) return
    setRejecting(true)
    try {
      await onReject(submission)
    } finally {
      setRejecting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Avatar src={submission.userPhotoURL} name={submission.userDisplayName} size="sm" />
          <div>
            <p className="text-sm font-medium text-white">{submission.userDisplayName}</p>
            <p className="text-xs text-gray-500">{formatRelative(submission.createdAt)}</p>
          </div>
        </div>
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.className)}>
          {cfg.label}
        </span>
      </div>

      {/* ── Evidence ── */}
      {submission.evidenceText && (
        <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3">{submission.evidenceText}</p>
      )}
      {submission.evidenceImageUrl && (
        <img
          src={submission.evidenceImageUrl}
          alt="Evidencia"
          className="w-full max-h-56 object-contain rounded-lg border border-gray-700 mb-3"
        />
      )}
      {!submission.evidenceText && !submission.evidenceImageUrl && (
        <p className="text-xs text-gray-600 italic mb-3">Sin evidencia adjunta</p>
      )}

      {/* ── Rating (if complete) ── */}
      {submission.status === 'complete' && submission.rating !== null && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <StarDisplay value={submission.rating} />
          <span>{submission.rating}/5</span>
        </div>
      )}

      {/* ── Owner actions ── */}
      {canAct && (
        <div className="border-t border-gray-800 pt-3 mt-1">
          {!showApprovePanel ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowApprovePanel(true)}>
                Aprobar
              </Button>
              <Button size="sm" variant="danger" loading={rejecting} onClick={handleReject}>
                Rechazar
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Calificación (opcional)</p>
              <StarPicker value={rating} onChange={setRating} />
              <div className="flex gap-2">
                <Button size="sm" loading={approving} onClick={handleApprove}>
                  Confirmar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowApprovePanel(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
