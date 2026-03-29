import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { SideQuest } from '../../types/sidequest'
import { cn } from '../../utils/cn'

interface Props {
  open: boolean
  onClose: () => void
  quest: SideQuest & { evidenceData?: string | null; evidenceRejected?: boolean; completionPending?: boolean }
  onConfirm: (rating: number | null) => Promise<void>
  onReject: () => Promise<void>
}

function StarRating({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  const active = hovered ?? value ?? 0

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(value === star ? null : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="transition-transform hover:scale-125 focus:outline-none"
          aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
        >
          <svg
            className={cn(
              'w-8 h-8 transition-colors',
              active >= star ? 'text-yellow-400' : 'text-gray-600'
            )}
            fill={active >= star ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
            />
          </svg>
        </button>
      ))}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Quitar
        </button>
      )}
    </div>
  )
}

export function ValidateModal({ open, onClose, quest, onConfirm, onReject }: Props) {
  const [rating, setRating] = useState<number | null>(null)
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)

  async function handleConfirm() {
    setLoading('confirm')
    try {
      await onConfirm(rating)
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    setLoading('reject')
    try {
      await onReject()
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Validar completado" className="max-w-lg">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Quest</p>
          <p className="text-sm text-white font-medium">{quest.title}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
            Evidencia enviada
            {quest.evidenceType === 'text' && ' · Texto'}
            {quest.evidenceType === 'photo' && ' · Foto'}
          </p>

          {quest.evidenceType === 'text' && quest.evidenceData && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3">
              <p className="text-sm text-gray-200 whitespace-pre-wrap">{quest.evidenceData}</p>
            </div>
          )}

          {quest.evidenceType === 'photo' && quest.evidenceData && (
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <img
                src={quest.evidenceData}
                alt="Evidencia"
                className="w-full max-h-72 object-contain bg-gray-950"
              />
            </div>
          )}

          {quest.evidenceType === 'none' && (
            <p className="text-sm text-gray-400 italic">Esta quest no requería evidencia.</p>
          )}
        </div>

        {/* Calificación */}
        <div className="rounded-xl border border-gray-800 bg-gray-950/50 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
            Calificación <span className="normal-case text-gray-600">(opcional)</span>
          </p>
          <StarRating value={rating} onChange={setRating} />
          <p className="mt-2 text-xs text-gray-600">
            {rating === null
              ? 'Sin calificación — el suscriptor no recibirá estrellas'
              : `${rating} de 5 estrellas`}
          </p>
        </div>

        <div className="flex gap-3 pt-1 border-t border-gray-800">
          <Button
            variant="danger"
            onClick={handleReject}
            loading={loading === 'reject'}
            disabled={loading === 'confirm'}
            className="flex-1"
          >
            Rechazar evidencia
          </Button>
          <Button
            onClick={handleConfirm}
            loading={loading === 'confirm'}
            disabled={loading === 'reject'}
            className="flex-1"
          >
            Confirmar completado
          </Button>
        </div>
      </div>
    </Modal>
  )
}
