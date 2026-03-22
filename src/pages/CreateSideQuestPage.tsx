import { useNavigate } from 'react-router-dom'
import { SideQuestForm } from '../components/sidequests/SideQuestForm'
import { createSidequest } from '../firebase/sidequests'
import { useAuth } from '../hooks/useAuth'
import type { SideQuestInput } from '../schemas/sidequestSchema'
import { toast } from '../components/ui/Toast'
import { Spinner } from '../components/ui/Spinner'

export function CreateSideQuestPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  async function handleSubmit(data: SideQuestInput) {
    if (!profile) {
      toast('Tu perfil aún no cargó, intenta de nuevo', 'error')
      return
    }
    try {
      const id = await createSidequest(data, profile)
      toast('¡Quest creada!', 'success')
      navigate(`/quests/${id}`)
    } catch (e) {
      console.error('Error creando quest:', e)
      toast('Error al crear la quest', 'error')
    }
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Nueva SideQuest</h1>
        <p className="text-sm text-gray-400 mt-1">Define los detalles de tu quest</p>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <SideQuestForm onSubmit={handleSubmit} submitLabel="Crear Quest" />
      </div>
    </div>
  )
}
