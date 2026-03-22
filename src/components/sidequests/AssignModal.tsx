import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { UserProfile } from '../../types/user'

interface Props {
  open: boolean
  onClose: () => void
  friends: UserProfile[]
  currentUser: UserProfile
  onAssign: (user: UserProfile) => Promise<void>
}

export function AssignModal({ open, onClose, friends, currentUser, onAssign }: Props) {
  const [assigning, setAssigning] = useState<string | null>(null)

  async function handleAssign(user: UserProfile) {
    setAssigning(user.uid)
    try {
      await onAssign(user)
      onClose()
    } finally {
      setAssigning(null)
    }
  }

  const allOptions = [currentUser, ...friends]

  return (
    <Modal open={open} onClose={onClose} title="Asignar quest">
      <ul className="flex flex-col gap-2">
        {allOptions.map((user, index) => (
          <li
            key={user.uid}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar src={user.photoURL} name={user.displayName} size="md" />
              <div>
                <p className="text-sm font-medium text-white">
                  {user.displayName}
                  {index === 0 && <span className="ml-1.5 text-xs text-purple-400">(yo)</span>}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <Button
              size="sm"
              loading={assigning === user.uid}
              onClick={() => handleAssign(user)}
            >
              Asignar
            </Button>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
