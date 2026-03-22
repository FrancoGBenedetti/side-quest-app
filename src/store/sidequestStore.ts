import { create } from 'zustand'
import type { SideQuest } from '../types/sidequest'

interface SideQuestState {
  ownedSidequests: SideQuest[]
  assignedSidequests: SideQuest[]
  searchResults: SideQuest[]
  setOwnedSidequests: (quests: SideQuest[]) => void
  setAssignedSidequests: (quests: SideQuest[]) => void
  setSearchResults: (quests: SideQuest[]) => void
}

export const useSideQuestStore = create<SideQuestState>((set) => ({
  ownedSidequests: [],
  assignedSidequests: [],
  searchResults: [],
  setOwnedSidequests: (quests) => set({ ownedSidequests: quests }),
  setAssignedSidequests: (quests) => set({ assignedSidequests: quests }),
  setSearchResults: (quests) => set({ searchResults: quests }),
}))
