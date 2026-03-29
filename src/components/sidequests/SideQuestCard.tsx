import { Link } from 'react-router-dom'
import type { SideQuest } from '../../types/sidequest'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { SideQuestStatusBadge } from './SideQuestStatusBadge'
import { ExpireCountdown } from './ExpireCountdown'
import { cn } from '../../utils/cn'
import { isExpired } from '../../utils/isExpired'

interface Props {
  quest: SideQuest
  currentUserId?: string
  action?: React.ReactNode
}

export function SideQuestCard({ quest, currentUserId, action }: Props) {
  const expired = isExpired(quest)
  const isFull = quest.maxSubscribers !== null && quest.subscribersCount >= quest.maxSubscribers

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-gray-900 p-4 transition-colors hover:border-gray-700',
        expired ? 'border-red-900/50' : 'border-gray-800'
      )}
    >
      {expired && (
        <div className="absolute inset-0 rounded-xl bg-red-950/20 pointer-events-none" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <SideQuestStatusBadge status={quest.status} />
            {quest.visibility === 'public' && <Badge variant="blue">Pública</Badge>}
            {isFull && <Badge variant="default">Llena</Badge>}
          </div>

          <Link
            to={`/quests/${quest.id}`}
            className="block font-semibold text-white hover:text-purple-400 transition-colors truncate"
          >
            {quest.title}
          </Link>

          <p className="mt-1 text-sm text-gray-400 line-clamp-2">{quest.description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-500">🏆</span>
          <span className="text-gray-300 truncate max-w-[120px]">{quest.reward}</span>
        </div>

        <span className="text-gray-700">·</span>
        <ExpireCountdown quest={quest} />

        <span className="text-gray-700">·</span>
        <span className="text-gray-400">
          {quest.subscribersCount}
          {quest.maxSubscribers !== null ? `/${quest.maxSubscribers}` : ''} suscriptores
        </span>

        {currentUserId && quest.ownerId !== currentUserId && (
          <>
            <span className="text-gray-700">·</span>
            <div className="flex items-center gap-1">
              <Avatar src={quest.ownerPhotoURL} name={quest.ownerDisplayName} size="sm" />
              <span>{quest.ownerDisplayName}</span>
            </div>
          </>
        )}
      </div>

      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
