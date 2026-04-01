import type { SideQuest } from '../../types/sidequest'
import { SideQuestCard } from './SideQuestCard'
import { EmptyState } from '../ui/EmptyState'

interface Props {
  quests: SideQuest[]
  currentUserId?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  onOpen?: (quest: SideQuest) => void
}

export function SideQuestList({ quests, currentUserId, emptyTitle = 'No hay quests', emptyDescription, emptyAction, onOpen }: Props) {
  if (!quests.length) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        icon={
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {quests.map((quest) => (
        <SideQuestCard key={quest.id} quest={quest} currentUserId={currentUserId} onOpen={onOpen} />
      ))}
    </div>
  )
}
