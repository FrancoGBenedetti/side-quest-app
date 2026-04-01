import { useRef, useState } from 'react'
import { Button } from '../ui/Button'
import { uploadEvidenceImage } from '../../firebase/storageHelpers'
import type { SideQuest } from '../../types/sidequest'

interface Props {
  quest: SideQuest
  questId: string
  onSubmit: (evidenceText: string | null, evidenceImageUrl: string | null) => Promise<void>
  onCancel: () => void
}

export function SubmissionForm({ quest, questId, onSubmit, onCancel }: Props) {
  const [text, setText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const needsText = quest.evidenceType === 'text'
  const needsPhoto = quest.evidenceType === 'photo'
  const needsAny = quest.evidenceType !== 'none'

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) {
        imageUrl = await uploadEvidenceImage(questId, imageFile)
      }
      await onSubmit(text.trim() || null, imageUrl)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = !needsAny || (needsText && text.trim()) || (needsPhoto && imageFile) || (!needsText && !needsPhoto)

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-purple-800/40 bg-purple-950/10 p-4">
      <p className="text-sm font-semibold text-purple-300">Enviar evidencia</p>

      {(needsText || !needsAny) && (
        <textarea
          placeholder="Describe cómo completaste la quest..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
        />
      )}

      {(needsPhoto || !needsAny) && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Preview" className="w-full max-h-40 object-contain rounded-lg border border-gray-700" />
              <button
                type="button"
                onClick={() => { setImageFile(null); setPreview(null) }}
                className="absolute top-1 right-1 rounded-full bg-gray-900/80 p-1 text-gray-400 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border border-dashed border-gray-600 px-4 py-3 text-sm text-gray-400 hover:border-gray-400 hover:text-gray-200 transition-colors"
            >
              + Adjuntar foto
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={loading} disabled={!canSubmit}>
          Enviar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
