import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { SideQuest } from '../../types/sidequest'

interface Props {
  open: boolean
  onClose: () => void
  quest: SideQuest & { evidenceData?: string | null; evidenceRejected?: boolean; completionPending?: boolean }
  onConfirm: () => Promise<void>
  onReject: () => Promise<void>
}

export function ValidateModal({ open, onClose, quest, onConfirm, onReject }: Props) {
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)

  async function handleConfirm() {
    setLoading('confirm')
    try {
      await onConfirm()
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
