import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SideQuestForm } from '../components/sidequests/SideQuestForm'
import { getSidequest, updateSidequest } from '../firebase/sidequests'
import { useAuth } from '../hooks/useAuth'
import type { SideQuestInput } from '../schemas/sidequestSchema'
import type { SideQuest } from '../types/sidequest'
import { Spinner } from '../components/ui/Spinner'
import { toast } from '../components/ui/Toast'

export function EditSideQuestPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [quest, setQuest] = useState<SideQuest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getSidequest(id).then((q) => {
      if (!q || q.ownerId !== profile?.uid) {
        navigate('/')
        return
      }
      setQuest(q)
      setLoading(false)
    })
  }, [id, profile?.uid])

  async function handleSubmit(data: SideQuestInput) {
    if (!id) return
    try {
      await updateSidequest(id, data)
      toast('Quest actualizada', 'success')
      navigate(`/quests/${id}`)
    } catch {
      toast('Error al actualizar la quest', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Editar Quest</h1>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <SideQuestForm onSubmit={handleSubmit} defaultValues={quest ?? undefined} submitLabel="Guardar cambios" />
      </div>
    </div>
  )
}
