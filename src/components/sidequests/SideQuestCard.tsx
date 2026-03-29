import { Link } from 'react-router-dom'
import type { SideQuest } from '../../types/sidequest'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { SideQuestStatusBadge } from './SideQuestStatusBadge'
import { ExpireCountdown } from './ExpireCountdown'
import { cn } from '../../utils/cn'
import { isExpired } from '../../utils/isExpired'
import { QUEST_CATEGORY_MAP } from '../../constants/questCategories'

interface Props {
  quest: SideQuest
  currentUserId?: string
  action?: React.ReactNode
  /** 'list' (default) = fila vertical; 'grid' = card cuadrada con footer fijo al fondo */
  variant?: 'list' | 'grid'
}

export function SideQuestCard({ quest, currentUserId, action, variant = 'list' }: Props) {
  const expired = isExpired(quest)
  const isFull = quest.maxSubscribers !== null && quest.subscribersCount >= quest.maxSubscribers
  const isGrid = variant === 'grid'

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-gray-900 transition-colors hover:border-gray-700',
        isGrid ? 'flex flex-col h-full p-5' : 'p-4',
        expired ? 'border-red-900/50' : 'border-gray-800'
      )}
    >
      {expired && (
        <div className="absolute inset-0 rounded-xl bg-red-950/20 pointer-events-none" />
      )}

      {/* ── Body (grows in grid) ──────────────────────────────────── */}
      <div className={cn(isGrid && 'flex-1 min-w-0')}>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <SideQuestStatusBadge status={quest.status} />
          {quest.visibility === 'public' && <Badge variant="blue">Pública</Badge>}
          {isFull && <Badge variant="default">Llena</Badge>}
        </div>

        <Link
          to={`/quests/${quest.id}`}
          className={cn(
            'block font-semibold text-white hover:text-purple-400 transition-colors',
            isGrid ? 'text-base leading-snug' : 'truncate'
          )}
        >
          {quest.title}
        </Link>

        <p className="mt-1.5 text-sm text-gray-400 line-clamp-2">{quest.description}</p>

        {quest.tags && quest.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {quest.tags.map((tagId) => {
              const cat = QUEST_CATEGORY_MAP[tagId]
              if (!cat) return null
              return (
                <span
                  key={tagId}
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                    cat.badgeClass
                  )}
                >
                  {cat.emoji} {cat.label}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer metadata ───────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center gap-x-2 gap-y-1 text-xs text-gray-500 flex-wrap',
          isGrid
            ? 'mt-4 pt-3 border-t border-gray-800'
            : 'mt-3'
        )}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-500">🏆</span>
          <span className="text-gray-300 truncate max-w-[110px]">{quest.reward}</span>
        </div>

        <span className="text-gray-700">·</span>
        <ExpireCountdown quest={quest} />

        <span className="text-gray-700">·</span>
        <span className="flex items-center gap-1 text-gray-400">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {quest.subscribersCount}
          {quest.maxSubscribers !== null && (
            <span className="text-gray-600">/{quest.maxSubscribers}</span>
          )}
        </span>

        {currentUserId && quest.ownerId !== currentUserId && (
          <>
            <span className="text-gray-700">·</span>
            <div className="flex items-center gap-1">
              <Avatar src={quest.ownerPhotoURL} name={quest.ownerDisplayName} size="sm" />
              <span className="truncate max-w-[80px]">{quest.ownerDisplayName}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Action ───────────────────────────────────────────────── */}
      {action && (
        <div className={cn(isGrid ? 'mt-3' : 'mt-3')}>
          {action}
        </div>
      )}
    </div>
  )
}
