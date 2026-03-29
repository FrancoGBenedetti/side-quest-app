export interface QuestCategory {
  id: string
  label: string
  emoji: string
  /** Clases Tailwind completas para el chip/badge de la categoría */
  badgeClass: string
  /** Clases para el botón activo en el picker */
  activeClass: string
}

/**
 * Categorías disponibles para las sidequests.
 * Importar esta constante donde se necesite — en el futuro
 * puede reemplazarse por una llamada a una API externa.
 */
export const QUEST_CATEGORIES: QuestCategory[] = [
  {
    id: 'deporte',
    label: 'Deporte',
    emoji: '⚽',
    badgeClass: 'bg-blue-900/50 text-blue-400 border border-blue-800',
    activeClass: 'border-blue-500 bg-blue-600/20 text-blue-300',
  },
  {
    id: 'destreza',
    label: 'Destreza',
    emoji: '🎯',
    badgeClass: 'bg-orange-900/50 text-orange-400 border border-orange-800',
    activeClass: 'border-orange-500 bg-orange-600/20 text-orange-300',
  },
  {
    id: 'arte',
    label: 'Arte',
    emoji: '🎨',
    badgeClass: 'bg-pink-900/50 text-pink-400 border border-pink-800',
    activeClass: 'border-pink-500 bg-pink-600/20 text-pink-300',
  },
  {
    id: 'foto',
    label: 'Foto',
    emoji: '📸',
    badgeClass: 'bg-purple-900/50 text-purple-400 border border-purple-800',
    activeClass: 'border-purple-500 bg-purple-600/20 text-purple-300',
  },
  {
    id: 'dibujo',
    label: 'Dibujo',
    emoji: '✏️',
    badgeClass: 'bg-yellow-900/50 text-yellow-400 border border-yellow-800',
    activeClass: 'border-yellow-500 bg-yellow-600/20 text-yellow-300',
  },
  {
    id: 'comida',
    label: 'Comida',
    emoji: '🍕',
    badgeClass: 'bg-red-900/50 text-red-400 border border-red-800',
    activeClass: 'border-red-500 bg-red-600/20 text-red-300',
  },
  {
    id: 'servicio',
    label: 'Servicio',
    emoji: '🤝',
    badgeClass: 'bg-green-900/50 text-green-400 border border-green-800',
    activeClass: 'border-green-500 bg-green-600/20 text-green-300',
  },
  {
    id: 'diversión',
    label: 'Diversión',
    emoji: '🎉',
    badgeClass: 'bg-amber-900/50 text-amber-400 border border-amber-800',
    activeClass: 'border-amber-500 bg-amber-600/20 text-amber-300',
  },
  {
    id: 'danza',
    label: 'Danza',
    emoji: '💃',
    badgeClass: 'bg-fuchsia-900/50 text-fuchsia-400 border border-fuchsia-800',
    activeClass: 'border-fuchsia-500 bg-fuchsia-600/20 text-fuchsia-300',
  },
]

/** Lookup rápido por id */
export const QUEST_CATEGORY_MAP = Object.fromEntries(
  QUEST_CATEGORIES.map((c) => [c.id, c])
) as Record<string, QuestCategory>
