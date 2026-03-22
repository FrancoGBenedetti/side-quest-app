import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { ToastProvider } from './components/ui/Toast'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { CreateSideQuestPage } from './pages/CreateSideQuestPage'
import { EditSideQuestPage } from './pages/EditSideQuestPage'
import { SideQuestDetailPage } from './pages/SideQuestDetailPage'
import { ExplorePage } from './pages/ExplorePage'
import { FriendsPage } from './pages/FriendsPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    const unsub = init()
    return unsub
  }, [init])

  return (
    <BrowserRouter>
      <ToastProvider />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/quests/new" element={<CreateSideQuestPage />} />
            <Route path="/quests/:id" element={<SideQuestDetailPage />} />
            <Route path="/quests/:id/edit" element={<EditSideQuestPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
