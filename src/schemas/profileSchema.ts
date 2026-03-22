import { z } from 'zod'

export const profileSchema = z.object({
  displayName: z.string().min(2, 'Mínimo 2 caracteres').max(40, 'Máximo 40 caracteres'),
  bio: z.string().max(200, 'Máximo 200 caracteres').nullable(),
})

export type ProfileInput = z.infer<typeof profileSchema>
