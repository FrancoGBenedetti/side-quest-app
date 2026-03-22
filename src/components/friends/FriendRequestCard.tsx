import { useState } from 'react'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import type { FriendRequest } from '../../types/friendRequest'
import type { UserProfile } from '../../types/user'
import { acceptFriendRequest, rejectFriendRequest } from '../../firebase/friends'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../ui/Toast'

interface Props {
  request: FriendRequest
  fromUser: UserProfile | null
}

export function FriendRequestCard({ request, fromUser }: Props) {
  const { profile } = useAuth()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [handled, setHandled] = useState(false)

  if (handled || !fromUser || !profile) return null

  async function handleAccept() {
    if (!profile || !fromUser) return
    setLoading('accept')
    try {
      await acceptFriendRequest(request.id, fromUser.uid, profile)
      setHandled(true)
      toast(`Ahora eres amigo de ${fromUser.displayName}`, 'success')
    } catch {
      toast('Error al aceptar solicitud', 'error')
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    if (!profile || !fromUser) return
    setLoading('reject')
    try {
      await rejectFriendRequest(request.id, fromUser.uid, profile)
      setHandled(true)
      toast('Solicitud rechazada', 'info')
    } catch {
      toast('Error al rechazar solicitud', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
      <div className="flex items-center gap-3">
        <Avatar src={fromUser.photoURL} name={fromUser.displayName} size="md" />
        <div>
          <p className="text-sm font-medium text-white">{fromUser.displayName}</p>
          <p className="text-xs text-gray-500">{fromUser.email}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAccept} loading={loading === 'accept'}>Aceptar</Button>
        <Button size="sm" variant="secondary" onClick={handleReject} loading={loading === 'reject'}>Rechazar</Button>
      </div>
    </div>
  )
}
