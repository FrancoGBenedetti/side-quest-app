import { useParams, useNavigate } from 'react-router-dom'
import { SidequestModal } from '../components/sidequests/SidequestModal'

export function SideQuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return null

  return (
    <div className="fixed inset-0 bg-gray-950/95 flex items-center justify-center p-4 z-40">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <SidequestModal
        questId={id}
        onClose={() => navigate(-1)}
        isStandalone
      />
    </div>
  )
}
