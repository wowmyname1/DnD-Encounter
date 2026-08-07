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

      addSpell: (spell) =>
        set(state => ({
          customSpells: [...state.customSpells, spell],
        })),

      updateSpell: (spell) =>
        set(state => ({
          customSpells: state.customSpells.map(s =>
            s.id === spell.id ? spell : s
          ),
        })),

      removeSpell: (id) =>
        set(state => ({
          customSpells: state.customSpells.filter(s => s.id !== id),
        })),

      addStatus: (status) =>
        set(state => ({
          customStatuses: [...state.customStatuses, status],
        })),

      updateStatus: (status) =>
        set(state => ({
          customStatuses: state.customStatuses.map(s =>
            s.id === status.id ? status : s
          ),
        })),

      removeStatus: (id) =>
        set(state => ({
          customStatuses: state.customStatuses.filter(s => s.id !== id),
        })),

      getAllSpells: () => [...SPELL_CATALOG, ...get().customSpells],
      getAllStatuses: () => [...STATUS_CATALOG, ...get().customStatuses],
    }),
    {
      name: 'dnd-catalog-storage',
    }
  )
)
