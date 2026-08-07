import { create } from 'zustand'
import type { ActiveRoll, Die, TargetMode } from '@/types'
import { parseDiceExpression, validateExpression } from '@/utils/diceParser'

interface DiceStore {
  activeRoll: ActiveRoll | null
  history: string[]
  modifier: number

  roll: (expression: string) => { total: number } | null
  rollDie: (sides: number) => void
  setMode: (mode: TargetMode) => void
  toggleDie: (dieId: number) => void
  clearRoll: () => void
  clearSelection: () => void
  getSelectedSum: () => number
  setModifier: (mod: number) => void
}

export const useDiceStore = create<DiceStore>((set, get) => ({
  activeRoll: null,
  history: [],
  modifier: 0,

  roll: (expression) => {
    const validation = validateExpression(expression)
    if (!validation.valid) return null

    const result = parseDiceExpression(expression)
    set(state => ({
      activeRoll: {
        expression: result.expression,
        dice: result.allDice,
        modifier: result.modifier,
        mode: 'single',
        aoeTargets: new Set(),
      },
      history: [String(result.total), ...state.history].slice(0, 10),
    }))
    return { total: result.total }
  },

  rollDie: (sides) => {
    const mod = get().modifier
    const expr = `1d${sides}${mod !== 0 ? (mod > 0 ? '+' + mod : String(mod)) : ''}`
    get().roll(expr)
  },

  setMode: (mode) =>
    set(state => ({
      activeRoll: state.activeRoll
        ? { ...state.activeRoll, mode, aoeTargets: new Set() }
        : null,
    })),

  toggleDie: (dieId) =>
    set(state => {
      if (!state.activeRoll) return state
      return {
        activeRoll: {
          ...state.activeRoll,
          dice: state.activeRoll.dice.map(d =>
            d.id === dieId && !d.spent
              ? { ...d, selected: !d.selected }
              : d
          ),
        },
      }
    }),

  clearRoll: () => set({ activeRoll: null }),

  clearSelection: () =>
    set(state => {
      if (!state.activeRoll) return state
      return {
        activeRoll: {
          ...state.activeRoll,
          dice: state.activeRoll.dice.map(d => ({ ...d, selected: false })),
        },
      }
    }),

  getSelectedSum: () => {
    const { activeRoll } = get()
    if (!activeRoll) return 0
    let posSum = 0
    let negSum = 0
    activeRoll.dice
      .filter(d => d.selected && !d.spent)
      .forEach(d => {
        if (d.sign === '+') posSum += d.value
        else negSum += d.value
      })
    return posSum - negSum + activeRoll.modifier
  },

  setModifier: (mod) => set({ modifier: mod }),
}))
