export const QUEST_CONFIG = {
  /** Opciones mostradas en el selector de límite de suscriptores */
  subscriberOptions: [1, 2, 3, 5, 10] as const,
  /** Máximo absoluto permitido (validación en schema) */
  maxAllowed: 10,
  /** null = ilimitado (valor por defecto al crear) */
  defaultMaxSubscribers: null as number | null,
} as const

export type SubscriberOption = (typeof QUEST_CONFIG.subscriberOptions)[number]
