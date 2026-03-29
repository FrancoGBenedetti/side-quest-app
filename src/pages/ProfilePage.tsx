import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileInput } from '../schemas/profileSchema'
import { updateUserProfile, getCompletedQuests } from '../firebase/users'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { getUserProfile } from '../firebase/users'
import { Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { toast } from '../components/ui/Toast'
import { useSidequests } from '../hooks/useSidequests'
import { useSubscriptions } from '../hooks/useSubscriptions'
import type { CompletedQuestEntry } from '../types/user'
import { QUEST_CATEGORY_MAP } from '../constants/questCategories'
import { cn } from '../utils/cn'
import { Link } from 'react-router-dom'

function StarDisplay({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-gray-600 italic">Sin calificación</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn('w-4 h-4', rating >= star ? 'text-yellow-400' : 'text-gray-700')}
          fill={rating >= star ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      ))}
      <span className="ml-1 text-xs text-yellow-400 font-medium">{rating}/5</span>
    </div>
  )
}

export function ProfilePage() {
  const { user, profile } = useAuth()
  const { setProfile } = useAuthStore()
  const { ownedSidequests } = useSidequests()
  const { subscriptions } = useSubscriptions()
  const [completedQuests, setCompletedQuests] = useState<CompletedQuestEntry[]>([])
  const [loadingCompleted, setLoadingCompleted] = useState(true)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName ?? '',
      bio: profile?.bio ?? null,
    },
  })

  useEffect(() => {
    if (!user) return
    getCompletedQuests(user.uid)
      .then(setCompletedQuests)
      .finally(() => setLoadingCompleted(false))
  }, [user?.uid])

  async function onSubmit(data: ProfileInput) {
    if (!user) return
    try {
      await updateUserProfile(user.uid, data)
      const updated = await getUserProfile(user.uid)
      setProfile(updated)
      toast('Perfil actualizado', 'success')
    } catch {
      toast('Error al actualizar perfil', 'error')
    }
  }

  const activeSubscriptions = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'pending'
  ).length

  // Promedio de rating de quests completadas con calificación
  const ratedQuests = completedQuests.filter((q) => q.rating !== null)
  const avgRating =
    ratedQuests.length > 0
      ? ratedQuests.reduce((sum, q) => sum + (q.rating ?? 0), 0) / ratedQuests.length
      : null

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Creadas', value: ownedSidequests.length },
          { label: 'Completadas', value: completedQuests.length },
          { label: 'En progreso', value: activeSubscriptions },
          {
            label: 'Rating promedio',
            value: avgRating !== null ? avgRating.toFixed(1) : '—',
            icon: avgRating !== null ? '⭐' : null,
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900 p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">
              {stat.icon && <span className="mr-0.5 text-lg">{stat.icon}</span>}
              {stat.value}
            </p>
            <p className="text-[11px] text-gray-500 mt-1 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <Avatar src={profile?.photoURL} name={profile?.displayName ?? 'U'} size="lg" />
        <div>
          <p className="text-base font-semibold text-white">{profile?.displayName}</p>
          <p className="text-sm text-gray-400">{profile?.email}</p>
          <p className="text-xs text-gray-600 mt-1">{profile?.friendIds.length} amigos</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-base font-semibold text-white mb-4">Editar información</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Nombre de usuario"
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <Textarea
            label="Bio"
            rows={3}
            placeholder="Cuéntanos algo sobre ti..."
            error={errors.bio?.message}
            {...register('bio')}
          />
          <Button type="submit" loading={isSubmitting}>Guardar cambios</Button>
        </form>
      </div>

      {/* Historial de quests completadas */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Quests completadas
          {completedQuests.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">({completedQuests.length})</span>
          )}
        </h2>

        {loadingCompleted ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : completedQuests.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <p className="text-3xl">🏆</p>
            <p className="text-sm text-gray-500">Aún no has completado ninguna quest.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {completedQuests.map((entry) => (
              <li
                key={entry.questId}
                className="rounded-xl border border-gray-800 bg-gray-950 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/quests/${entry.questId}`}
                    className="text-sm font-semibold text-white hover:text-purple-400 transition-colors"
                  >
                    {entry.questTitle}
                  </Link>
                  <StarDisplay rating={entry.rating} />
                </div>

                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <span>🏆</span> {entry.questReward}
                </p>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((tagId) => {
                      const cat = QUEST_CATEGORY_MAP[tagId]
                      if (!cat) return null
                      return (
                        <span
                          key={tagId}
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                            cat.badgeClass
                          )}
                        >
                          {cat.emoji} {cat.label}
                        </span>
                      )
                    })}
                  </div>
                )}

                <p className="text-[11px] text-gray-600">
                  Creada por {entry.questOwnerDisplayName} ·{' '}
                  {entry.completedAt?.toDate
                    ? entry.completedAt.toDate().toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
