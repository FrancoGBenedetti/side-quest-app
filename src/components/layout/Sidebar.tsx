import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { useNotifications } from '../../hooks/useNotifications'
import { useFriends } from '../../hooks/useFriends'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/explore',
    label: 'Explorar',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    to: '/friends',
    label: 'Amigos',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    badge: 'friends',
  },
  {
    to: '/quests/new',
    label: 'Crear Quest',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

export function Sidebar() {
  useNotifications()
  const { pendingRequests } = useFriends()

  return (
    <aside className="hidden lg:flex lg:flex-col w-56 bg-gray-950 border-r border-gray-800 h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600">
          <span className="text-sm font-bold text-white">SQ</span>
        </div>
        <span className="text-base font-bold text-white">SideQuest</span>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge === 'friends' && pendingRequests.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
