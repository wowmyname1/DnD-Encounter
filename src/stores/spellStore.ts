import { create } from 'zustand'
import type { SpellDefinition, TargetMode } from '@/types'
import { parseDiceExpression } from '@/utils/diceParser'
import { useCharacterStore } from '@/stores/characterStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { PERMANENT_STATUSES, TIMED_STATUSES } from '@/data/statusDefs'
import { STATUS_CATALOG } from '@/data/statuses'

interface CastResult {
  name: string
  success: boolean | null
  details: string
}

interface SpellStore {
  activeSpell: SpellDefinition | null
  spellTargets: Set<number>
  lastSpellTarget: number | null
  selecting: boolean
  castLog: { spell: SpellDefinition; dc: number; results: CastResult[] } | null

  startCast: (spell: SpellDefinition) => void
  cancelCast: () => void
  toggleTarget: (charId: number) => void
  setSingleTarget: (charId: number) => void
  executeCast: (casterLevel?: number) => void
}

export const useSpellStore = create<SpellStore>((set, get) => ({
  activeSpell: null,
  spellTargets: new Set(),
  lastSpellTarget: null,
  selecting: false,
  castLog: null,

  startCast: (spell) =>
    set({
      activeSpell: spell,
      spellTargets: new Set(),
      lastSpellTarget: null,
      selecting: true,
      castLog: null,
    }),

  cancelCast: () =>
    set({
      activeSpell: null,
      spellTargets: new Set(),
      lastSpellTarget: null,
      selecting: false,
      castLog: null,
    }),

  toggleTarget: (charId) =>
    set(state => {
      const targets = new Set(state.spellTargets)
      if (targets.has(charId)) targets.delete(charId)
      else targets.add(charId)
      return { spellTargets: targets }
    }),

  setSingleTarget: (charId) =>
    set({ lastSpellTarget: charId, selecting: false }),

  executeCast: (casterLevel = 5) => {
    const { activeSpell, spellTargets, lastSpellTarget } = get()
    if (!activeSpell) return

    const { characters, applyDamage, applyHeal, addStatus } =
      useCharacterStore.getState()

    const dc = calculateDC(activeSpell, casterLevel)
    const results: CastResult[] = []

    let targetIds: number[] = []
    if (activeSpell.logic.targetMode === 'single') {
      if (lastSpellTarget === null) return
      targetIds = [lastSpellTarget]
    } else {
      targetIds = Array.from(spellTargets)
      if (targetIds.length === 0) return
    }

    for (const charId of targetIds) {
      const char = characters.find(c => c.id === charId)
      if (!char) continue

      let success: boolean | null = null
      if (activeSpell.logic.save) {
        const saveRoll = Math.floor(Math.random() * 20) + 1
        success = saveRoll >= dc
        results.push({
          name: char.name,
          success,
          details: `d20=${saveRoll} (DC ${dc})`,
        })
      } else {
        results.push({ name: char.name, success: true, details: 'Без спасброска' })
      }

      const effectKey = success === true ? 'onSuccess' : 'onFail'
      const effect = activeSpell.logic[effectKey]
      if (!effect) continue

      if (effect.type === 'damage') {
        let formula = effect.formula || '1d6'
        if (success === true && formula.includes('d')) {
          formula = formula.replace(/(\d+)d/, (_, n) => Math.ceil(parseInt(n) / 2) + 'd')
        }
        const result = parseDiceExpression(formula)
        applyDamage(charId, result.total)
      } else if (effect.type === 'heal') {
        const result = parseDiceExpression(effect.formula || '1d8')
        applyHeal(charId, result.total)
      } else if (effect.type === 'applyStatus') {
        const allDefs = [
          ...STATUS_CATALOG,
          ...useCatalogStore.getState().customStatuses,
          ...PERMANENT_STATUSES,
          ...TIMED_STATUSES,
        ]
        const def = allDefs.find(s => s.id === effect.statusId)
        if (def) {
          addStatus(charId, {
            id: def.id,
            name: def.name,
            icon: def.icon,
            color: def.color,
            type: 'timed',
            duration: effect.duration || 3,
          })
        }
      }
    }

    set({
      castLog: { spell: activeSpell, dc, results },
      activeSpell: null,
      spellTargets: new Set(),
      lastSpellTarget: null,
      selecting: false,
    })

    setTimeout(() => set({ castLog: null }), 4000)
  },
}))

function calculateDC(spell: SpellDefinition, casterLevel: number): number {
  if (!spell.logic.save) return 10
  const prof = Math.ceil(casterLevel / 4) + 1
  return 8 + prof + 3
}
