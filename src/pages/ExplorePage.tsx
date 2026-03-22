import { useState, useEffect } from 'react'
import { searchPublicSidequests } from '../firebase/sidequests'
import { useDebounce } from '../hooks/useDebounce'
import type { SideQuest } from '../types/sidequest'
import { SideQuestCard } from '../components/sidequests/SideQuestCard'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

type StatusFilter = 'incomplete' | 'all' | 'complete' | 'failed'

export function ExplorePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('incomplete')
  const [results, setResults] = useState<SideQuest[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    setLoading(true)
    searchPublicSidequests(debouncedQuery, status)
      .then(setResults)
      .finally(() => setLoading(false))
  }, [debouncedQuery, status])

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Explorar</h1>
        <p className="text-sm text-gray-400 mt-1">Encuentra quests públicas y únete a ellas</p>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar quests..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
        >
          <option value="incomplete">Disponibles</option>
          <option value="all">Todas</option>
          <option value="complete">Completadas</option>
          <option value="failed">Falladas</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" className="text-purple-500" /></div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No se encontraron quests"
          description={query ? `Sin resultados para "${query}"` : 'Sé el primero en crear una quest pública'}
          icon={
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((quest) => {
            const isOwner = quest.ownerId === profile?.uid
            const isAssignee = quest.assigneeId === profile?.uid
            const canTake = !isOwner && !isAssignee && !quest.assigneeId && quest.status === 'incomplete'

            return (
              <SideQuestCard
                key={quest.id}
                quest={quest}
                currentUserId={profile?.uid}
                action={
                  canTake ? (
                    <Button size="sm" onClick={() => navigate(`/quests/${quest.id}`)}>
                      Ver Quest
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/quests/${quest.id}`)}>
                      Ver detalles
                    </Button>
                  )
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
