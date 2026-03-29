import { Link } from 'react-router-dom'
import { useSidequests } from '../hooks/useSidequests'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useAuth } from '../hooks/useAuth'
import { SideQuestList } from '../components/sidequests/SideQuestList'
import { SubscriptionStatusBadge } from '../components/sidequests/SideQuestStatusBadge'
import { Spinner } from '../components/ui/Spinner'

export function DashboardPage() {
  const { profile } = useAuth()
  const { ownedSidequests } = useSidequests()
  const { subscriptions, loading: subsLoading } = useSubscriptions()

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'pending'
  )

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

      {/* Mis Quests creadas */}
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
            <Link to="/quests/new" className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
              Crear mi primera Quest
            </Link>
          }
        />
      </section>

      {/* Quests en las que participo (subscriptions) */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          Mis Participaciones
          <span className="text-sm font-normal text-gray-500">({activeSubscriptions.length})</span>
        </h2>

        {subsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" className="text-purple-500" />
          </div>
        ) : activeSubscriptions.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center text-sm text-gray-500">
            No tienes quests asignadas.{' '}
            <Link to="/explore" className="text-purple-400 hover:text-purple-300">
              Explora quests públicas →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activeSubscriptions.map((sub) => (
              <li key={sub.questId}>
                <Link
                  to={`/quests/${sub.questId}`}
                  className="block rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <SubscriptionStatusBadge status={sub.status} />
                        {sub.completionPending && (
                          <span className="text-xs text-yellow-400">Esperando validación</span>
                        )}
                        {sub.evidenceRejected && !sub.completionPending && (
                          <span className="text-xs text-red-400">Evidencia rechazada</span>
                        )}
                      </div>
                      <p className="font-semibold text-white truncate">{sub.questTitle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        por {sub.questOwnerDisplayName}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-yellow-500">🏆</p>
                      <p className="text-xs text-gray-400 truncate max-w-[100px]">{sub.questReward}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
