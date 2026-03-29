import { z } from 'zod'
import { QUEST_CONFIG } from '../config/questConfig'
import { QUEST_CATEGORIES } from '../constants/questCategories'

const validTagIds = QUEST_CATEGORIES.map((c) => c.id)

export const sidequestSchema = z
  .object({
    title: z.string().min(1, 'El título es requerido').max(100, 'Máximo 100 caracteres'),
    description: z.string().min(1, 'La descripción es requerida').max(1000, 'Máximo 1000 caracteres'),
    reward: z.string().min(1, 'La recompensa es requerida').max(500, 'Máximo 500 caracteres'),
    isEternal: z.boolean(),
    expiresAt: z.string().nullable(),
    visibility: z.enum(['public', 'private']),
    evidenceType: z.enum(['none', 'photo', 'text']),
    tags: z
      .array(z.string().refine((t) => validTagIds.includes(t), { message: 'Categoría inválida' }))
      .optional(),
    /**
     * null = ilimitado
     * number = 1..QUEST_CONFIG.maxAllowed
     */
    maxSubscribers: z
      .number()
      .int()
      .min(1, 'Mínimo 1 suscriptor')
      .max(QUEST_CONFIG.maxAllowed, `Máximo ${QUEST_CONFIG.maxAllowed} suscriptores`)
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.isEternal && !data.expiresAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debes indicar una fecha de expiración',
        path: ['expiresAt'],
      })
    }
    if (!data.isEternal && data.expiresAt) {
      const date = new Date(data.expiresAt)
      if (date <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La fecha de expiración debe ser en el futuro',
          path: ['expiresAt'],
        })
      }
    }
  })

export type SideQuestInput = z.infer<typeof sidequestSchema>
