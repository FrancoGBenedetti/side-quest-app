import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sidequestSchema, type SideQuestInput } from '../../schemas/sidequestSchema'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import type { SideQuest } from '../../types/sidequest'
import { Timestamp } from 'firebase/firestore'

interface Props {
  onSubmit: (data: SideQuestInput) => Promise<void>
  defaultValues?: SideQuest
  submitLabel?: string
}

function toInputDate(ts: Timestamp | null | undefined): string | null {
  if (!ts) return null
  const d = ts.toDate()
  return d.toISOString().slice(0, 16)
}

export function SideQuestForm({ onSubmit, defaultValues, submitLabel = 'Crear Quest' }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SideQuestInput>({
    resolver: zodResolver(sidequestSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      reward: defaultValues?.reward ?? '',
      isEternal: defaultValues?.isEternal ?? true,
      expiresAt: toInputDate(defaultValues?.expiresAt),
      visibility: defaultValues?.visibility ?? 'private',
    },
  })

  const isEternal = watch('isEternal')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <Input
        label="Título"
        placeholder="Nombre de la sidequest"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="Descripción"
        placeholder="Describe lo que hay que hacer..."
        error={errors.description?.message}
        {...register('description')}
      />

      <Textarea
        label="Recompensa"
        rows={2}
        placeholder="¿Qué obtendrá el que la complete?"
        error={errors.reward?.message}
        {...register('reward')}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">Duración</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isEternal === true}
              onChange={() => setValue('isEternal', true, { shouldValidate: true })}
              className="accent-purple-500"
            />
            <span className="text-sm text-gray-300">Eterna</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isEternal === false}
              onChange={() => setValue('isEternal', false, { shouldValidate: true })}
              className="accent-purple-500"
            />
            <span className="text-sm text-gray-300">Expira</span>
          </label>
        </div>
      </div>

      {!isEternal && (
        <Input
          label="Fecha de expiración"
          type="datetime-local"
          error={errors.expiresAt?.message}
          min={new Date().toISOString().slice(0, 16)}
          {...register('expiresAt')}
        />
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">Visibilidad</label>
        <div className="flex gap-4">
          {(['private', 'public'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={v} {...register('visibility')} className="accent-purple-500" />
              <span className="text-sm text-gray-300">{v === 'private' ? 'Privada' : 'Pública'}</span>
            </label>
          ))}
        </div>
        {errors.visibility && <p className="text-xs text-red-400">{errors.visibility.message}</p>}
        <p className="text-xs text-gray-500">Las quests públicas aparecen en el explorador global.</p>
      </div>

      <Button type="submit" loading={isSubmitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  )
}
