import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SpellDefinition, StatusDefinition } from '@/types'
import { SPELL_CATALOG } from '@/data/spells'
import { STATUS_CATALOG } from '@/data/statuses'

interface CatalogStore {
  customSpells: SpellDefinition[]
  customStatuses: StatusDefinition[]
  addSpell: (spell: SpellDefinition) => void
  updateSpell: (spell: SpellDefinition) => void
  removeSpell: (id: string) => void
  addStatus: (status: StatusDefinition) => void
  updateStatus: (status: StatusDefinition) => void
  removeStatus: (id: string) => void
  getAllSpells: () => SpellDefinition[]
  getAllStatuses: () => StatusDefinition[]
}

export const useCatalogStore = create<CatalogStore>()(
  persist(
    (set, get) => ({
      customSpells: [],
      customStatuses: [],
      addSpell: (spell) => set(s => ({ customSpells: [...s.customSpells, spell] })),
      updateSpell: (spell) => set(s => ({
        customSpells: s.customSpells.map(x => x.id === spell.id ? spell : x),
      })),
      removeSpell: (id) => set(s => ({
        customSpells: s.customSpells.filter(x => x.id !== id),
      })),
      addStatus: (status) => set(s => ({ customStatuses: [...s.customStatuses, status] })),
      updateStatus: (status) => set(s => ({
        customStatuses: s.customStatuses.map(x => x.id === status.id ? status : x),
      })),
      removeStatus: (id) => set(s => ({
        customStatuses: s.customStatuses.filter(x => x.id !== id),
      })),
      getAllSpells: () => [...SPELL_CATALOG, ...get().customSpells],
      getAllStatuses: () => [...STATUS_CATALOG, ...get().customStatuses],
    }),
    { name: 'dnd-catalog-storage' }
  )
)
