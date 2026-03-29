import type { SideQuest } from '../types/sidequest'

export type QuestSortBy = 'popular' | 'recent'

/**
 * Ordena una lista de quests por popularidad (subscribersCount desc).
 * No muta el array original.
 */
export function sortByPopularity(quests: SideQuest[]): SideQuest[] {
  return [...quests].sort((a, b) => b.subscribersCount - a.subscribersCount)
}

/**
 * Ordena una lista de quests por fecha de creación (más reciente primero).
 * Firebase ya devuelve los resultados ordenados por createdAt desc,
 * pero esta función permite aplicar el mismo orden tras un re-sort.
 */
export function sortByRecent(quests: SideQuest[]): SideQuest[] {
  return [...quests].sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

export function sortQuests(quests: SideQuest[], by: QuestSortBy): SideQuest[] {
  return by === 'popular' ? sortByPopularity(quests) : sortByRecent(quests)
}
