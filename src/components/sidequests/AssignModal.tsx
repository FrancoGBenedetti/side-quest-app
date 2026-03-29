import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { UserProfile } from '../../types/user'
import type { SideQuest } from '../../types/sidequest'

interface Props {
  open: boolean
  onClose: () => void
  quest: SideQuest
  friends: UserProfile[]
  currentUser: UserProfile
  existingSubscriberIds: string[]
  onAssign: (user: UserProfile) => Promise<void>
}

export function AssignModal({
  open,
  onClose,
  quest,
  friends,
  currentUser,
  existingSubscriberIds,
  onAssign,
}: Props) {
  const [assigning, setAssigning] = useState<string | null>(null)
  const [errorUid, setErrorUid] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const availableSlots =
    quest.maxSubscribers !== null
      ? quest.maxSubscribers - quest.subscribersCount
      : null

  const isFull = availableSlots !== null && availableSlots <= 0

  async function handleAssign(user: UserProfile) {
    setErrorUid(null)
    setErrorMsg(null)
    setAssigning(user.uid)
    try {
      await onAssign(user)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'ALREADY_SUBSCRIBED') {
        setErrorUid(user.uid)
        setErrorMsg('Solicitud pendiente de aprobación')
      } else if (msg === 'QUEST_FULL') {
        setErrorUid(user.uid)
        setErrorMsg('La quest está llena')
      } else {
        setErrorUid(user.uid)
        setErrorMsg('Ocurrió un error. Intenta de nuevo.')
      }
    } finally {
      setAssigning(null)
    }
  }

  const allOptions = [currentUser, ...friends]

  return (
    <Modal open={open} onClose={onClose} title="Asignar quest">
      <div className="flex flex-col gap-3">
        {/* Cupos disponibles */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {quest.subscribersCount} suscriptor{quest.subscribersCount !== 1 ? 'es' : ''}
          </span>
          <span>
            {availableSlots !== null
              ? isFull
                ? 'Sin cupos disponibles'
                : `${availableSlots} cupo${availableSlots !== 1 ? 's' : ''} libre${availableSlots !== 1 ? 's' : ''}`
              : 'Sin límite'}
          </span>
        </div>

        {isFull && (
          <p className="rounded-lg border border-yellow-800 bg-yellow-950/30 px-3 py-2 text-sm text-yellow-400">
            La quest está llena. No se pueden agregar más suscriptores.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {allOptions.map((user, index) => {
            const isSubscribed = existingSubscriberIds.includes(user.uid)
            const disabled = isFull || isSubscribed
            const hasError = errorUid === user.uid

            return (
              <li key={user.uid} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.photoURL} name={user.displayName} size="md" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user.displayName}
                        {index === 0 && (
                          <span className="ml-1.5 text-xs text-purple-400">(yo)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  {isSubscribed ? (
                    <span className="text-xs text-yellow-400 font-medium">
                      Pendiente de aprobación
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      disabled={disabled}
                      loading={assigning === user.uid}
                      onClick={() => handleAssign(user)}
                    >
                      Asignar
                    </Button>
                  )}
                </div>

                {/* Error inline bajo la fila */}
                {hasError && errorMsg && (
                  <p className="pl-3 text-xs text-red-400">{errorMsg}</p>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}
