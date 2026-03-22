import { Avatar } from '../ui/Avatar'
import { AddFriendButton } from './AddFriendButton'
import type { UserProfile } from '../../types/user'

interface Props {
  user: UserProfile
}

export function UserSearchResult({ user }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-3">
        <Avatar src={user.photoURL} name={user.displayName} size="md" />
        <div>
          <p className="text-sm font-medium text-white">{user.displayName}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      <AddFriendButton targetUser={user} />
    </div>
  )
}
