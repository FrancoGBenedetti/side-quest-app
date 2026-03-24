import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFriends } from '../hooks/useFriends'
import { useAuth } from '../hooks/useAuth'
import { searchUsers, getUsersByIds } from '../firebase/users'
import { useDebounce } from '../hooks/useDebounce'
import type { UserProfile } from '../types/user'
import { Avatar } from '../components/ui/Avatar'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { FriendRequestCard } from '../components/friends/FriendRequestCard'
import { UserSearchResult } from '../components/friends/UserSearchResult'
import { removeFriend } from '../firebase/friends'
import { toast } from '../components/ui/Toast'
import { cn } from '../utils/cn'

type Tab = 'friends' | 'requests' | 'search'

export function FriendsPage() {
  const { profile } = useAuth()
  const { friends, pendingRequests, loadingFriends } = useFriends()
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) ?? 'friends'
  const [tab, setTab] = useState<Tab>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [requestUsers, setRequestUsers] = useState<Record<string, UserProfile | null>>({})
  const debouncedSearch = useDebounce(searchQuery, 350)

  // Load user profiles for pending requests
  useEffect(() => {
    if (!pendingRequests.length) return
    const fromIds = pendingRequests.map((r) => r.fromUserId)
    getUsersByIds(fromIds).then((users) => {
      const map: Record<string, UserProfile | null> = {}
      users.forEach((u) => { map[u.uid] = u })
      setRequestUsers(map)
    })
  }, [pendingRequests.map((r) => r.fromUserId).join(',')])

  // Search users
  useEffect(() => {
    if (!debouncedSearch.trim() || tab !== 'search') { setSearchResults([]); return }
    setSearching(true)
    searchUsers(debouncedSearch, profile?.uid ?? '').then(setSearchResults).finally(() => setSearching(false))
  }, [debouncedSearch, tab])

  async function handleRemoveFriend(friendId: string) {
    if (!profile || !confirm('¿Eliminar este amigo?')) return
    try {
      await removeFriend(profile, friendId)
      toast('Amigo eliminado', 'info')
    } catch {
      toast('Error al eliminar amigo', 'error')
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'friends', label: 'Amigos', count: friends.length },
    { id: 'requests', label: 'Solicitudes', count: pendingRequests.length },
    { id: 'search', label: 'Buscar' },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Amigos</h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
              tab === t.id
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold',
                tab === t.id ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'friends' && (
        <>
          {loadingFriends ? (
            <div className="flex justify-center py-8"><Spinner className="text-purple-500" /></div>
          ) : friends.length === 0 ? (
            <EmptyState
              title="Aún no tienes amigos"
              description="Busca usuarios y envíales una solicitud de amistad."
              action={<Button onClick={() => setTab('search')}>Buscar amigos</Button>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {friends.map((friend) => (
                <div key={friend.uid} className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={friend.photoURL} name={friend.displayName} size="md" />
                    <div>
                      <p className="text-sm font-medium text-white">{friend.displayName}</p>
                      <p className="text-xs text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveFriend(friend.uid)}>
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {pendingRequests.length === 0 ? (
            <EmptyState title="Sin solicitudes pendientes" description="Cuando alguien te envíe una solicitud, aparecerá aquí." />
          ) : (
            <div className="flex flex-col gap-3">
              {pendingRequests.map((req) => (
                <FriendRequestCard
                  key={req.id}
                  request={req}
                  fromUser={requestUsers[req.fromUserId] ?? null}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'search' && (
        <>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nombre de usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searching ? (
            <div className="flex justify-center py-8"><Spinner className="text-purple-500" /></div>
          ) : searchResults.length === 0 && debouncedSearch ? (
            <EmptyState title="Sin resultados" description={`No se encontraron usuarios para "${debouncedSearch}"`} />
          ) : (
            <div className="flex flex-col gap-3">
              {searchResults.map((user) => (
                <UserSearchResult key={user.uid} user={user} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
