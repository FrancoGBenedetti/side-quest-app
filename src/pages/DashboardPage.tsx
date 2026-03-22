import { Link } from 'react-router-dom'
import { useSidequests } from '../hooks/useSidequests'
import { useAuth } from '../hooks/useAuth'
import { SideQuestList } from '../components/sidequests/SideQuestList'

export function DashboardPage() {
  const { profile } = useAuth()
  const { ownedSidequests, assignedSidequests } = useSidequests()

  const pendingAssigned = assignedSidequests.filter((q) => q.ownerId !== profile?.uid)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Hola, {profile?.displayName} 👋</p>
        </div>
        <Link
          to="/quests/new"
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Quest
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>⚔️</span>
          Mis Quests
          <span className="text-sm font-normal text-gray-500">({ownedSidequests.length})</span>
        </h2>
        <SideQuestList
          quests={ownedSidequests}
          currentUserId={profile?.uid}
          emptyTitle="No has creado quests aún"
          emptyDescription="Crea tu primera sidequest y asígnala a un amigo o ponla en el explorador global."
          emptyAction={
            <Link to="/quests/new" className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">Crear mi primera Quest</Link>
          }
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          Asignadas a mí
          <span className="text-sm font-normal text-gray-500">({pendingAssigned.length})</span>
        </h2>
        <SideQuestList
          quests={pendingAssigned}
          currentUserId={profile?.uid}
          emptyTitle="No tienes quests asignadas"
          emptyDescription="Cuando alguien te asigne una quest o tomes una del explorador, aparecerá aquí."
        />
      </section>
    </div>
  )
}
