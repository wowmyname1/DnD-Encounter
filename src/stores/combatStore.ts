import { create } from 'zustand'
import type { CombatState } from '@/types'

interface CombatStore extends CombatState {
  startCombat: (turnOrder: number[]) => void
  nextTurn: () => void
  resetCombat: () => void
}

export const useCombatStore = create<CombatStore>((set) => ({
  active: false,
  turnOrder: [],
  currentTurnIndex: -1,
  round: 1,

  startCombat: (turnOrder) =>
    set({
      active: true,
      turnOrder,
      currentTurnIndex: 0,
      round: 1,
    }),

  nextTurn: () =>
    set(state => {
      let { currentTurnIndex, round, turnOrder } = state
      currentTurnIndex++
      if (currentTurnIndex >= turnOrder.length) {
        currentTurnIndex = 0
        round++
      }
      return { currentTurnIndex, round }
    }),

  resetCombat: () =>
    set({
      active: false,
      turnOrder: [],
      currentTurnIndex: -1,
      round: 1,
    }),
}))
