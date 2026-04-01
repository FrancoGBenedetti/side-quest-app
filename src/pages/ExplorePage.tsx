import { useState, useEffect, useMemo } from 'react'
import { searchPublicSidequests } from '../firebase/sidequests'
import { useDebounce } from '../hooks/useDebounce'
import { sortQuests, type QuestSortBy } from '../utils/sortQuests'
import type { SideQuest } from '../types/sidequest'
import { SideQuestCard } from '../components/sidequests/SideQuestCard'
import { SidequestModal } from '../components/sidequests/SidequestModal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../hooks/useAuth'
import { QUEST_CATEGORIES } from '../constants/questCategories'
import { cn } from '../utils/cn'

type StatusFilter = 'open' | 'all' | 'closed'

// ── Sort toggle ──────────────────────────────────────────────────────────────
function SortToggle({
  value,
  onChange,
}: {
  value: QuestSortBy
  onChange: (v: QuestSortBy) => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-700 overflow-hidden text-sm font-medium">
      {(
        [
          { id: 'popular', label: '🔥 Popular' },
          { id: 'recent', label: '🕒 Reciente' },
        ] as { id: QuestSortBy; label: string }[]
      ).map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'px-3 py-1.5 transition-colors',
            value === id
              ? 'bg-purple-600/30 text-purple-300'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Category pills ───────────────────────────────────────────────────────────
function CategoryFilters({
  activeTag,
  onChange,
}: {
  activeTag: string | undefined
  onChange: (tag: string | undefined) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          activeTag === undefined
            ? 'border-purple-500 bg-purple-600/20 text-purple-300'
            : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
        )}
      >
        Todas
      </button>
      {QUEST_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(activeTag === cat.id ? undefined : cat.id)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            activeTag === cat.id
              ? cat.activeClass
              : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
          )}
        >
          {cat.emoji} {cat.label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export function ExplorePage() {
  const { profile } = useAuth()

  // Modal
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null)

  // Filtros
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('open')
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState<QuestSortBy>('popular')

  // Datos
  const [rawResults, setRawResults] = useState<SideQuest[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 350)

  // Fetch
  useEffect(() => {
    setLoading(true)
    searchPublicSidequests(debouncedQuery, status, activeTag)
      .then(setRawResults)
      .finally(() => setLoading(false))
  }, [debouncedQuery, status, activeTag])

  // Ordenamiento client-side (sin re-fetch)
  const results = useMemo(() => sortQuests(rawResults, sortBy), [rawResults, sortBy])

  return (
    <div className="w-full px-5 lg:px-8 py-6">

      {/* ── Encabezado ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Explorar</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Encuentra quests públicas y únete a ellas
          </p>
        </div>
        <SortToggle value={sortBy} onChange={setSortBy} />
      </div>

      {/* ── Búsqueda + estado ───────────────────────────────────────── */}
      <div className="flex gap-3 mb-3 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar quests..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500 shrink-0"
        >
          <option value="open">Disponibles</option>
          <option value="all">Todas</option>
          <option value="closed">Cerradas</option>
        </select>
      </div>

      {/* ── Tags ────────────────────────────────────────────────────── */}
      <CategoryFilters activeTag={activeTag} onChange={setActiveTag} />

      {/* ── Resultado count ─────────────────────────────────────────── */}
      {!loading && (
        <p className="mt-4 mb-3 text-xs text-gray-600">
          {results.length === 0
            ? 'Sin resultados'
            : `${results.length} quest${results.length !== 1 ? 's' : ''} encontrada${results.length !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* ── Grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" className="text-purple-500" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No se encontraron quests"
          description={
            query
              ? `Sin resultados para "${query}"`
              : activeTag
              ? 'No hay quests públicas con esta categoría'
              : 'Sé el primero en crear una quest pública'
          }
          icon={
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((quest) => {
            const isOwner = quest.ownerId === profile?.uid
            const isFull =
              quest.maxSubscribers !== null &&
              quest.subscribersCount >= quest.maxSubscribers
            const canJoin = !isOwner && quest.status === 'open' && !isFull

            return (
              <SideQuestCard
                key={quest.id}
                quest={quest}
                variant="grid"
                currentUserId={profile?.uid}
                onOpen={(q) => setSelectedQuestId(q.id)}
                action={
                  canJoin ? (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedQuestId(quest.id)}
                    >
                      Ver Quest
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => setSelectedQuestId(quest.id)}
                    >
                      Ver detalles
                    </Button>
                  )
                }
              />
            )
          })}
        </div>
      )}

      {selectedQuestId && (
        <SidequestModal
          questId={selectedQuestId}
          onClose={() => setSelectedQuestId(null)}
        />
      )}
    </div>
  )
}
