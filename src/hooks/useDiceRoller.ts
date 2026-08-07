import { useState, useCallback } from 'react'
import { parseDiceExpression, validateExpression } from '@/utils/diceParser'
import type { ActiveRoll, TargetMode } from '@/types'

export function useDiceRoller() {
  const [activeRoll, setActiveRoll] = useState<ActiveRoll | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const roll = useCallback((expression: string) => {
    const validation = validateExpression(expression)
    if (!validation.valid) {
      throw new Error(validation.error || 'Неверное выражение')
    }

    const result = parseDiceExpression(expression)
    setActiveRoll({
      expression: result.expression,
      dice: result.allDice,
      modifier: result.modifier,
      mode: 'single',
      aoeTargets: new Set(),
    })
    setHistory(prev => [String(result.total), ...prev].slice(0, 10))
    return result
  }, [])

  const setMode = useCallback((mode: TargetMode) => {
    setActiveRoll(prev =>
      prev ? { ...prev, mode, aoeTargets: new Set() } : null
    )
  }, [])

  const toggleDie = useCallback((dieId: number) => {
    setActiveRoll(prev => {
      if (!prev) return null
      return {
        ...prev,
        dice: prev.dice.map(d =>
          d.id === dieId && !d.spent
            ? { ...d, selected: !d.selected }
            : d
        ),
      }
    })
  }, [])

  const getSelectedSum = useCallback(() => {
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
  }, [activeRoll])

  const clearRoll = useCallback(() => setActiveRoll(null), [])

  return {
    activeRoll,
    history,
    roll,
    setMode,
    toggleDie,
    getSelectedSum,
    clearRoll,
  }
}
