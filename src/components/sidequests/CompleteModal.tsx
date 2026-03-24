import { useRef, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { SideQuest } from '../../types/sidequest'
import { uploadEvidenceImage } from '../../firebase/storageHelpers'

interface Props {
  open: boolean
  onClose: () => void
  quest: SideQuest
  onSubmit: (evidenceData: string | null) => Promise<void>
}

export function CompleteModal({ open, onClose, quest, onSubmit }: Props) {
  const [loading, setLoading] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit() {
    setError(null)
    if (quest.evidenceType === 'text' && !textValue.trim()) {
      setError('Debes escribir la evidencia antes de enviar.')
      return
    }
    if (quest.evidenceType === 'photo' && !photoFile) {
      setError('Debes seleccionar una foto antes de enviar.')
      return
    }

    setLoading(true)
    try {
      let evidenceData: string | null = null
      if (quest.evidenceType === 'text') {
        evidenceData = textValue.trim()
      } else if (quest.evidenceType === 'photo' && photoFile) {
        evidenceData = await uploadEvidenceImage(quest.id, photoFile)
      }
      await onSubmit(evidenceData)
      setTextValue('')
      setPhotoFile(null)
      setPhotoPreview(null)
    } catch {
      setError('Ocurrió un error al enviar la evidencia. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Completar quest">
      <div className="flex flex-col gap-4">
        {quest.evidenceRejected && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3">
            <p className="text-sm text-red-400 font-medium">Tu evidencia anterior fue rechazada.</p>
            <p className="text-xs text-red-400/70 mt-0.5">Envía una nueva evidencia para que el owner pueda validarla.</p>
          </div>
        )}

        {quest.evidenceType === 'none' && (
          <p className="text-sm text-gray-300">
            ¿Confirmas que completaste la quest <span className="font-semibold text-white">"{quest.title}"</span>?
          </p>
        )}

        {quest.evidenceType === 'text' && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">
              Escribe tu evidencia
            </label>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Describe cómo completaste la quest..."
              rows={4}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
            />
          </div>
        )}

        {quest.evidenceType === 'photo' && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-300">
              Adjunta una foto como evidencia
            </label>
            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img src={photoPreview} alt="Preview" className="w-full max-h-48 object-cover rounded-lg" />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  className="absolute top-2 right-2 rounded-full bg-gray-900/80 p-1 text-gray-300 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-700 p-6 text-gray-500 hover:border-purple-600 hover:text-purple-400 transition-colors"
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Toca para seleccionar una foto</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            {quest.evidenceType === 'none' ? 'Confirmar completado' : 'Enviar evidencia'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
