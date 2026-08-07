import { create } from 'zustand'
import type { CombatState } from '@/types'
import { useCharacterStore } from '@/stores/characterStore'

interface CombatStore extends CombatState {
  startCombat: () => void
  nextTurn: () => void
  resetCombat: () => void
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  active: false,
  turnOrder: [],
  currentTurnIndex: -1,
  round: 1,

  startCombat: () => {
    const { characters } = useCharacterStore.getState()
    const alive = characters.filter(c => c.hp.current > 0)
    if (alive.length === 0) return

    const withInit = alive.map(c => ({
      id: c.id,
      init: c.initiative || Math.floor(Math.random() * 20) + 1,
    }))
    withInit.sort((a, b) => b.init - a.init)

    set({
      active: true,
      turnOrder: withInit.map(w => w.id),
      currentTurnIndex: 0,
      round: 1,
    })

    const firstCharId = withInit[0].id
    useCharacterStore.getState().triggerEvent(firstCharId, 'turnStart')
  },

  nextTurn: () => {
    const state = get()
    if (!state.active || state.turnOrder.length === 0) return

    const currentCharId = state.turnOrder[state.currentTurnIndex]
    const charStore = useCharacterStore.getState()

    charStore.triggerEvent(currentCharId, 'turnEnd')
    const expired = charStore.tickStatuses(currentCharId)

    let { currentTurnIndex, round, turnOrder } = state
    currentTurnIndex++

    if (currentTurnIndex >= turnOrder.length) {
      currentTurnIndex = 0
      round++
      const { characters } = useCharacterStore.getState()
      turnOrder = turnOrder.filter(id => {
        const c = characters.find(ch => ch.id === id)
        return c && c.hp.current > 0
      })
      if (turnOrder.length === 0) {
        get().resetCombat()
        return
      }
    }

    set({ currentTurnIndex, round, turnOrder })

    const newCharId = turnOrder[currentTurnIndex]
    useCharacterStore.getState().triggerEvent(newCharId, 'turnStart')
  },

  resetCombat: () => {
    const { characters, updateCharacter } = useCharacterStore.getState()
    characters.forEach(c => updateCharacter(c.id, { initiative: 0 }))
    set({
      active: false,
      turnOrder: [],
      currentTurnIndex: -1,
      round: 1,
    })
  },
}))
