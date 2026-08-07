import { create } from 'zustand'
import type { Character, CharacterType, StatusInstance, QuickRoll } from '@/types'

let nextId = 1
let statusUid = 1

interface CharacterStore {
  characters: Character[]

  addCharacter: (type: CharacterType, data: Partial<Character>) => void
  removeCharacter: (id: number) => void
  updateCharacter: (id: number, data: Partial<Character>) => void

  applyDamage: (id: number, amount: number) => void
  applyHeal: (id: number, amount: number) => void
  applyTempHp: (id: number, amount: number) => void

  addStatus: (charId: number, status: Omit<StatusInstance, 'uid'>) => void
  removeStatus: (charId: number, uid: number) => void

  addQuickRoll: (charId: number, roll: Omit<QuickRoll, 'id'>) => void
  removeQuickRoll: (charId: number, rollId: number) => void
}

export const useCharacterStore = create<CharacterStore>((set) => ({
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
          x: data.x || 100,
          y: data.y || 100,
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

  applyDamage: (id, amount) =>
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
          hp: {
            ...c.hp,
            temp,
            current: Math.max(0, c.hp.current - remaining),
          },
        }
      }),
    })),

  applyHeal: (id, amount) =>
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id !== id || amount <= 0) return c
        return {
          ...c,
          hp: {
            ...c.hp,
            current: Math.min(c.hp.max, c.hp.current + amount),
          },
        }
      }),
    })),

  applyTempHp: (id, amount) =>
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id !== id || amount <= 0) return c
        return {
          ...c,
          hp: { ...c.hp, temp: c.hp.temp + amount },
        }
      }),
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

  addQuickRoll: (charId, roll) =>
    set(state => ({
      characters: state.characters.map(c =>
        c.id === charId
          ? {
              ...c,
              quickRolls: [
                ...c.quickRolls,
                { ...roll, id: Date.now() },
              ],
            }
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
}))
