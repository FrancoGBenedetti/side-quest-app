import { useState, useEffect } from 'react'
import { Button } from '../ui/Button'
import type { UserProfile } from '../../types/user'
import {
  sendFriendRequest,
  withdrawFriendRequest,
  getPendingRequestId,
  removeFriend,
} from '../../firebase/friends'
import { useAuth } from '../../hooks/useAuth'
import { toast } from '../ui/Toast'

interface Props {
  targetUser: UserProfile
}

type FriendStatus = 'none' | 'friends' | 'sent' | 'received'

export function AddFriendButton({ targetUser }: Props) {
  const { profile } = useAuth()
  const [status, setStatus] = useState<FriendStatus>('none')
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile) return

    if (profile.friendIds.includes(targetUser.uid)) {
      setStatus('friends')
    } else if (profile.sentRequestIds.includes(targetUser.uid)) {
      setStatus('sent')
      getPendingRequestId(profile.uid, targetUser.uid).then(setPendingRequestId)
    } else if (profile.pendingRequestIds.includes(targetUser.uid)) {
      setStatus('received')
    } else {
      setStatus('none')
    }
  }, [profile, targetUser.uid])

  async function handleAction() {
    if (!profile) return
    setLoading(true)
    try {
      if (status === 'none') {
        await sendFriendRequest(profile, targetUser.uid)
        setStatus('sent')
        toast('Solicitud enviada', 'success')
      } else if (status === 'sent' && pendingRequestId) {
        await withdrawFriendRequest(pendingRequestId, profile, targetUser.uid)
        setStatus('none')
        toast('Solicitud cancelada', 'info')
      } else if (status === 'friends') {
        await removeFriend(profile, targetUser.uid)
        setStatus('none')
        toast('Amigo eliminado', 'info')
      }
    } catch {
      toast('Ocurrió un error', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'none') {
    return <Button size="sm" onClick={handleAction} loading={loading}>Agregar amigo</Button>
  }
  if (status === 'sent') {
    return <Button size="sm" variant="outline" onClick={handleAction} loading={loading}>Cancelar solicitud</Button>
  }
  if (status === 'received') {
    return <Button size="sm" variant="secondary" disabled>Solicitud recibida</Button>
  }
  return <Button size="sm" variant="ghost" onClick={handleAction} loading={loading}>Eliminar amigo</Button>
}
