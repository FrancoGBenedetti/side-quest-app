import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileSchema, type ProfileInput } from '../schemas/profileSchema'
import { updateUserProfile } from '../firebase/users'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { getUserProfile } from '../firebase/users'
import { Input, Textarea } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { toast } from '../components/ui/Toast'
import { useSidequests } from '../hooks/useSidequests'

export function ProfilePage() {
  const { user, profile } = useAuth()
  const { setProfile } = useAuthStore()
  const { ownedSidequests, assignedSidequests } = useSidequests()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName ?? '',
      bio: profile?.bio ?? null,
    },
  })

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

  const completedQuests = ownedSidequests.filter((q) => q.status === 'complete').length
  const assignedCompleted = assignedSidequests.filter((q) => q.status === 'complete' && q.ownerId !== user?.uid).length

  return (
    <div className="mx-auto max-w-xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Quests creadas', value: ownedSidequests.length },
          { label: 'Completadas', value: completedQuests },
          { label: 'Como responsable', value: assignedCompleted },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
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
    </div>
  )
}
