import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { logout } from '../../firebase/auth'
import { Avatar } from '../ui/Avatar'
import { NotificationBell } from '../notifications/NotificationBell'
import { useState } from 'react'
import { toast } from '../ui/Toast'

interface Props {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: Props) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
    toast('Sesión cerrada', 'info')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-950 px-4 lg:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-lg font-bold text-purple-400">SideQuest</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-800 transition-colors"
          >
            <Avatar src={profile?.photoURL} name={profile?.displayName ?? 'U'} size="sm" />
            <span className="hidden sm:block text-sm text-gray-300">{profile?.displayName}</span>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-gray-800 bg-gray-900 shadow-xl py-1">
                <button
                  onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Mi perfil
                </button>
                <hr className="my-1 border-gray-800" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
