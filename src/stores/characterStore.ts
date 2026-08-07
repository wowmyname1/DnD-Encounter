import { create } from 'zustand'
import type { Character, CharacterType, StatusInstance, QuickRoll, NodeEventType } from '@/types'
import { executeStatusTriggers, type ExecutionContext } from '@/utils/nodeExecutor'
import { STATUS_CATALOG } from '@/data/statuses'
import { PERMANENT_STATUSES, TIMED_STATUSES } from '@/data/statusDefs'
import { useCatalogStore } from '@/stores/catalogStore'

let nextId = 1
let statusUid = 1

interface CharacterStore {
  characters: Character[]

  addCharacter: (type: CharacterType, data: Partial<Character>) => void
  removeCharacter: (id: number) => void
  updateCharacter: (id: number, data: Partial<Character>) => void
  setPosition: (id: number, x: number, y: number) => void

  applyDamage: (id: number, amount: number) => void
  applyHeal: (id: number, amount: number) => void
  applyTempHp: (id: number, amount: number) => void
  setHp: (id: number, value: number) => void

  addStatus: (charId: number, status: Omit<StatusInstance, 'uid'>) => void
  removeStatus: (charId: number, uid: number) => void
  removeStatusById: (charId: number, statusId: string) => void
  tickStatuses: (charId: number) => StatusInstance[]

  addQuickRoll: (charId: number, roll: Omit<QuickRoll, 'id'>) => void
  removeQuickRoll: (charId: number, rollId: number) => void

  triggerEvent: (charId: number, event: NodeEventType, context?: ExecutionContext) => void
}

export const useCharacterStore = create<CharacterStore>((set, get) => ({
  characters: [],

  addCharacter: (type, data) =>
    set(state => ({
      characters: [
        ...state.characters,
        {
          id: nextId++,
          type,
          name: data.name || 'Безымянный',
          cls: data.cls || '—',
          level: data.level || 1,
          hp: {
            current: data.hp?.current ?? 30,
            max: data.hp?.max ?? 30,
            temp: 0,
          },
          ac: data.ac || 10,
          initiative: data.initiative || 0,
          color: data.color || '#e94560',
          statuses: [],
          quickRolls: [],
          x: data.x || 100 + Math.random() * 300,
          y: data.y || 100 + Math.random() * 200,
        },
      ],
    })),

  removeCharacter: (id) =>
    set(state => ({
      characters: state.characters.filter(c => c.id !== id),
    })),

  updateCharacter: (id, data) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),

  setPosition: (id, x, y) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === id ? { ...c, x, y } : c
      ),
    })),

  applyDamage: (id, amount) => {
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id !== id || amount <= 0) return c
        let remaining = amount
        let temp = c.hp.temp
        if (temp > 0) {
          const absorbed = Math.min(temp, remaining)
          temp -= absorbed
          remaining -= absorbed
        }
        return {
          ...c,
          hp: { ...c.hp, temp, current: Math.max(0, c.hp.current - remaining) },
        }
      }),
    }))
    get().triggerEvent(id, 'takeDamage', { damage: amount })
  },

  applyHeal: (id, amount) =>
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id !== id || amount <= 0) return c
        return {
          ...c,
          hp: { ...c.hp, current: Math.min(c.hp.max, c.hp.current + amount) },
        }
      }),
    })),

  applyTempHp: (id, amount) =>
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id !== id || amount <= 0) return c
        return { ...c, hp: { ...c.hp, temp: c.hp.temp + amount } }
      }),
    })),

  setHp: (id, value) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === id
          ? { ...c, hp: { ...c.hp, current: Math.min(c.hp.max, Math.max(0, value)) } }
          : c
      ),
    })),

  addStatus: (charId, status) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === charId
          ? { ...c, statuses: [...c.statuses, { ...status, uid: statusUid++ }] }
          : c
      ),
    })),

  removeStatus: (charId, uid) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === charId
          ? { ...c, statuses: c.statuses.filter(s => s.uid !== uid) }
          : c
      ),
    })),

  removeStatusById: (charId, statusId) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === charId
          ? { ...c, statuses: c.statuses.filter(s => s.id !== statusId) }
          : c
      ),
    })),

  tickStatuses: (charId) => {
    const char = get().characters.find(c => c.id === charId)
    if (!char) return []

    const expired: StatusInstance[] = []
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id !== charId) return c
        const remaining = c.statuses.filter(s => {
          if (s.type === 'timed' && s.duration !== null) {
            s.duration--
            if (s.duration <= 0) {
              expired.push(s)
              return false
            }
          }
          return true
        })
        return { ...c, statuses: remaining }
      }),
    }))
    return expired
  },

  addQuickRoll: (charId, roll) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === charId
          ? { ...c, quickRolls: [...c.quickRolls, { ...roll, id: Date.now() }] }
          : c
      ),
    })),

  removeQuickRoll: (charId, rollId) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === charId
          ? { ...c, quickRolls: c.quickRolls.filter(r => r.id !== rollId) }
          : c
      ),
    })),

  triggerEvent: (charId, event, context = {}) => {
    const { characters, applyDamage, applyHeal, addStatus, removeStatus, removeStatusById } = get()
    const allDefs = [
      ...STATUS_CATALOG,
      ...useCatalogStore.getState().customStatuses,
      ...PERMANENT_STATUSES,
      ...TIMED_STATUSES,
    ]
    executeStatusTriggers(charId, event, {
      applyDamage,
      applyHeal,
      addStatus,
      removeStatus,
      removeStatusById,
      getCharacter: (id) => get().characters.find(c => c.id === id),
      getAllStatusDefs: () => allDefs,
    }, context)
  },
}))
