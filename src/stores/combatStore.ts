import { create } from 'zustand'
import type { CombatState } from '@/types'
import { useCharacterStore } from '@/stores/characterStore'

interface CombatStore extends CombatState {
  startCombat: () => void
  nextTurn: () => void
  endCombat: () => void
  resetCombat: () => void
  currentTurnId: number | null
}

export const useCombatStore = create<CombatStore>((set, get) => ({
  active: false,
  turnOrder: [],
  currentTurnIndex: -1,
  round: 1,
  currentTurnId: null,

  startCombat: () => {
    const { characters } = useCharacterStore.getState()
    const alive = characters.filter(c => c.hp.current > 0)
    if (alive.length === 0) return
    const withInit = alive.map(c => ({
      id: c.id,
      init: c.initiative || Math.floor(Math.random() * 20) + 1,
    }))
    withInit.sort((a, b) => b.init - a.init)
    const turnOrderIds = withInit.map(w => w.id)
    set({ 
      active: true, 
      turnOrder: turnOrderIds, 
      currentTurnIndex: 0, 
      round: 1,
      currentTurnId: turnOrderIds[0]
    })
    useCharacterStore.getState().triggerEvent(turnOrderIds[0], 'turnStart')
  },

  nextTurn: () => {
    const state = get()
    if (!state.active || state.turnOrder.length === 0) return
    const currentCharId = state.turnOrder[state.currentTurnIndex]
    const charStore = useCharacterStore.getState()
    charStore.triggerEvent(currentCharId, 'turnEnd')
    charStore.tickStatuses(currentCharId)

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
      if (turnOrder.length === 0) { get().resetCombat(); return }
    }
    const nextTurnId = turnOrder[currentTurnIndex]
    set({ currentTurnIndex, round, turnOrder, currentTurnId: nextTurnId })
    useCharacterStore.getState().triggerEvent(nextTurnId, 'turnStart')
  },

  resetCombat: () => {
    const { characters, updateCharacter } = useCharacterStore.getState()
    characters.forEach(c => updateCharacter(c.id, { initiative: 0 }))
    set({ active: false, turnOrder: [], currentTurnIndex: -1, round: 1, currentTurnId: null })
  },
  
  endCombat: () => {
    set({ active: false, turnOrder: [], currentTurnIndex: -1, round: 1, currentTurnId: null })
  },
}))
