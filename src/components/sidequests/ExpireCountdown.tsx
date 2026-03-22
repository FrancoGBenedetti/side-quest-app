import type { SideQuest } from '../../types/sidequest'
import { getTimeRemaining } from '../../utils/isExpired'
import { cn } from '../../utils/cn'

interface Props {
  quest: SideQuest
}

export function ExpireCountdown({ quest }: Props) {
  const { expired, urgent, label } = getTimeRemaining(quest)

  if (quest.isEternal) {
    return (
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Eterna
      </span>
    )
  }

  return (
    <span
      className={cn(
        'text-xs flex items-center gap-1',
        expired ? 'text-red-400' : urgent ? 'text-orange-400' : 'text-gray-400'
      )}
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {label}
    </span>
  )
}
