#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}▸${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; exit 1; }

[ -f "package.json" ] || error "Запустите в корне проекта (где package.json)"

info "ЭТАП 1: Данные каталогов + движок узлов + stores"

mkdir -p src/data src/utils src/stores

# ===== 1. Каталог заклинаний =====
info "Создаю каталог заклинаний..."
cat > src/data/spells.ts << 'EOF'
import type { SpellDefinition } from '@/types'

export const SPELL_CATALOG: SpellDefinition[] = [
  {
    id: 'fireball', name: 'Огненный шар', level: 3, school: 'Воплощение',
    icon: '🔥', castingTime: '1 действие', range: '150 футов', duration: 'Мгновенная',
    classes: ['Волшебник', 'Чародей'],
    description: 'Яркий луч вспыхивает из вас к точке в пределах дистанции и взрывается огненным шаром.',
    logic: {
      targetMode: 'aoe',
      save: { ability: 'DEX', dcFormula: '8 + prof + mod' },
      onFail: { type: 'damage', formula: '8d6', damageType: 'fire' },
      onSuccess: { type: 'damage', formula: '4d6', damageType: 'fire' },
    },
  },
  {
    id: 'magic_missile', name: 'Волшебная стрела', level: 1, school: 'Воплощение',
    icon: '✨', castingTime: '1 действие', range: '120 футов', duration: 'Мгновенная',
    classes: ['Волшебник', 'Чародей'],
    description: 'Вы создаёте три светящихся дротика из магической силы.',
    logic: {
      targetMode: 'spread', save: null,
      onFail: { type: 'damage', formula: '1d4+1', damageType: 'force' },
      onSuccess: null,
    },
  },
  {
    id: 'hold_person', name: 'Удержание личности', level: 2, school: 'Очарование',
    icon: '⛓️', castingTime: '1 действие', range: '60 футов',
    duration: 'Концентрация, до 1 минуты',
    classes: ['Волшебник', 'Чародей', 'Бард', 'Жрец', 'Друид'],
    description: 'Цель должна преуспеть в спасброске Мудрости, иначе станет парализованной.',
    logic: {
      targetMode: 'single',
      save: { ability: 'WIS', dcFormula: '8 + prof + mod' },
      onFail: { type: 'applyStatus', statusId: 'paralyzed', duration: 10 },
      onSuccess: null,
    },
  },
  {
    id: 'cure_wounds', name: 'Лечение ран', level: 1, school: 'Воплощение',
    icon: '💚', castingTime: '1 действие', range: 'Касание', duration: 'Мгновенная',
    classes: ['Жрец', 'Бард', 'Друид', 'Паладин', 'Следопыт'],
    description: 'Существо восстанавливает хиты равные 1d8 + модификатор.',
    logic: {
      targetMode: 'single', save: null,
      onFail: { type: 'heal', formula: '1d8+3' },
      onSuccess: null,
    },
  },
  {
    id: 'lightning_bolt', name: 'Молния', level: 3, school: 'Проявление',
    icon: '⚡', castingTime: '1 действие', range: '100 футов (линия 100×5)',
    duration: 'Мгновенная', classes: ['Волшебник', 'Чародей'],
    description: 'Разряд молнии длиной 100 футов и шириной 5 футов бьёт из вас.',
    logic: {
      targetMode: 'aoe',
      save: { ability: 'DEX', dcFormula: '8 + prof + mod' },
      onFail: { type: 'damage', formula: '8d6', damageType: 'lightning' },
      onSuccess: { type: 'damage', formula: '4d6', damageType: 'lightning' },
    },
  },
  {
    id: 'shield_spell', name: 'Щит', level: 1, school: 'Ограждение',
    icon: '🛡️', castingTime: '1 реакция', range: 'На себя', duration: '1 раунд',
    classes: ['Волшебник', 'Чародей'],
    description: 'Невидимый барьер магической силы появляется и защищает вас.',
    logic: {
      targetMode: 'single', save: null,
      onFail: { type: 'applyStatus', statusId: 'shield_of_faith', duration: 1 },
      onSuccess: null,
    },
  },
]
EOF
ok "Каталог заклинаний создан"

# ===== 2. Каталог статусов =====
info "Создаю каталог статусов..."
cat > src/data/statuses.ts << 'EOF'
import type { StatusDefinition } from '@/types'

export const STATUS_CATALOG: StatusDefinition[] = [
  {
    id: 'burning_custom', name: 'Горит (продвинутый)', icon: '🔥', color: '#e67e22',
    description: 'Начало хода: 1d6 урона огнём. Можно снять действием.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', parentId: null, event: 'turnStart' },
        { id: 2, type: 'action', parentId: 1, action: 'damage', formula: '1d6', damageType: 'fire' },
        { id: 3, type: 'trigger', parentId: null, event: 'manual' },
        { id: 4, type: 'action', parentId: 3, action: 'removeStatus', statusId: 'self' },
      ],
    },
  },
  {
    id: 'regen_custom', name: 'Регенерация', icon: '💚', color: '#2ecc71',
    description: 'Начало хода: восстановление 5 HP. Снимается при полном HP.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', parentId: null, event: 'turnStart' },
        { id: 2, type: 'action', parentId: 1, action: 'heal', formula: '5' },
        { id: 3, type: 'condition', parentId: 2, check: 'hpPercent', op: '>=', value: 100 },
        { id: 4, type: 'action', parentId: 3, action: 'removeStatus', statusId: 'self' },
      ],
    },
  },
  {
    id: 'low_hp_panic', name: 'Паника (низкие HP)', icon: '😱', color: '#9b59b6',
    description: 'Автоматически накладывает Испуг при HP < 25%. Снимается при HP > 50%.',
    logic: {
      nodes: [
        { id: 1, type: 'trigger', parentId: null, event: 'turnStart' },
        { id: 2, type: 'condition', parentId: 1, check: 'hpPercent', op: '<=', value: 25 },
        { id: 3, type: 'condition', parentId: 2, check: 'hasStatus', statusId: 'self', op: 'not' },
        { id: 4, type: 'action', parentId: 3, action: 'applyStatus', statusId: 'frightened', duration: 3 },
        { id: 5, type: 'condition', parentId: 1, check: 'hpPercent', op: '>=', value: 50 },
        { id: 6, type: 'action', parentId: 5, action: 'removeStatus', statusId: 'self' },
      ],
    },
  },
]
EOF
ok "Каталог статусов создан"

# ===== 3. Базовые определения статусов =====
info "Создаю базовые определения статусов..."
cat > src/data/statusDefs.ts << 'EOF'
export interface StatusDef {
  id: string
  name: string
  icon: string
  color: string
}

export const PERMANENT_STATUSES: StatusDef[] = [
  { id: 'blinded', name: 'Ослеплён', icon: '👁️', color: '#555' },
  { id: 'charmed', name: 'Очарован', icon: '💖', color: '#ff6b9d' },
  { id: 'deafened', name: 'Оглох', icon: '🔇', color: '#777' },
  { id: 'frightened', name: 'Испуган', icon: '😱', color: '#9b59b6' },
  { id: 'grappled', name: 'Схвачен', icon: '🤝', color: '#d35400' },
  { id: 'incapacitated', name: 'Недееспособен', icon: '💫', color: '#7f8c8d' },
  { id: 'invisible', name: 'Невидим', icon: '👻', color: '#bdc3c7' },
  { id: 'paralyzed', name: 'Парализован', icon: '⚡', color: '#f1c40f' },
  { id: 'petrified', name: 'Окаменел', icon: '🗿', color: '#95a5a6' },
  { id: 'poisoned', name: 'Отравлен', icon: '☠️', color: '#27ae60' },
  { id: 'prone', name: 'Сбит с ног', icon: '🤸', color: '#e67e22' },
  { id: 'restrained', name: 'Опутан', icon: '⛓️', color: '#c0392b' },
  { id: 'stunned', name: 'Оглушён', icon: '💥', color: '#e74c3c' },
  { id: 'unconscious', name: 'Без сознания', icon: '😴', color: '#2c3e50' },
  { id: 'exhaustion', name: 'Истощение', icon: '🥵', color: '#8e44ad' },
]

export const TIMED_STATUSES: StatusDef[] = [
  { id: 'rage', name: 'Ярость', icon: '🔥', color: '#e74c3c' },
  { id: 'blessed', name: 'Благословение', icon: '✨', color: '#f1c40f' },
  { id: 'hasted', name: 'Ускорен', icon: '⚡', color: '#3498db' },
  { id: 'slowed', name: 'Замедлен', icon: '🐌', color: '#95a5a6' },
  { id: 'concentrating', name: 'Концентрация', icon: '🎯', color: '#1abc9c' },
  { id: 'burning', name: 'Горит', icon: '🔥', color: '#e67e22' },
  { id: 'flying', name: 'Полёт', icon: '🕊️', color: '#3498db' },
  { id: 'invisibility', name: 'Невидимость', icon: '👻', color: '#bdc3c7' },
  { id: 'bardic_insp', name: 'Вдохновение', icon: '🎵', color: '#9b59b6' },
  { id: 'shield_of_faith', name: 'Щит веры', icon: '🛡️', color: '#f39c12' },
  { id: 'hex', name: 'Сглаз', icon: '🧿', color: '#8e44ad' },
  { id: 'hunter_mark', name: 'Метка охотника', icon: '🏹', color: '#27ae60' },
  { id: 'rage_bear', name: 'Ярость варвара', icon: '🐻', color: '#c0392b' },
  { id: 'regenerating', name: 'Регенерация', icon: '💚', color: '#2ecc71' },
]
EOF
ok "Базовые определения статусов созданы"

# ===== 4. Движок выполнения узлов =====
info "Создаю движок узлов..."
cat > src/utils/nodeExecutor.ts << 'EOF'
import type { Character, StatusInstance, StatusNode, NodeEventType } from '@/types'
import { parseDiceExpression } from '@/utils/diceParser'

export interface ExecutionContext {
  damage?: number
  lastRoll?: number
}

export interface NodeActions {
  applyDamage: (id: number, amount: number) => void
  applyHeal: (id: number, amount: number) => void
  addStatus: (charId: number, status: {
    id: string; name: string; icon: string; color: string
    type: 'permanent' | 'timed'; duration: number | null
    logic?: { nodes: StatusNode[] }
  }) => void
  removeStatus: (charId: number, uid: number) => void
  removeStatusById: (charId: number, statusId: string) => void
  getCharacter: (id: number) => Character | undefined
  getAllStatusDefs: () => Array<{
    id: string; name: string; icon: string; color: string
    logic?: { nodes: StatusNode[] }
  }>
}

let inTrigger = false

export function executeStatusTriggers(
  charId: number,
  event: NodeEventType,
  actions: NodeActions,
  context: ExecutionContext = {}
): void {
  if (inTrigger) return
  inTrigger = true
  try {
    const char = actions.getCharacter(charId)
    if (!char) return
    const statusesCopy = [...char.statuses]
    for (const status of statusesCopy) {
      if (!status.logic?.nodes) continue
      const triggers = status.logic.nodes.filter(
        n => n.type === 'trigger' && n.event === event
      )
      for (const trigger of triggers) {
        executeNode(charId, status, trigger.id, actions, context, 0)
      }
    }
  } finally {
    inTrigger = false
  }
}

function executeNode(
  charId: number, status: StatusInstance, nodeId: number,
  actions: NodeActions, context: ExecutionContext, depth: number
): void {
  if (depth > 20) return
  const char = actions.getCharacter(charId)
  if (!char) return
  const node = status.logic?.nodes.find(n => n.id === nodeId)
  if (!node) return

  let shouldContinue = true
  if (node.type === 'condition') {
    shouldContinue = evaluateCondition(char, node, context)
  } else if (node.type === 'action') {
    executeAction(charId, status, node, actions, context)
  }

  if (shouldContinue) {
    const children = (status.logic?.nodes || []).filter(n => n.parentId === nodeId)
    for (const child of children) {
      executeNode(charId, status, child.id, actions, context, depth + 1)
    }
  }
}

function evaluateCondition(char: Character, node: StatusNode, context: ExecutionContext): boolean {
  if (node.check === 'hpPercent') {
    const pct = (char.hp.current / char.hp.max) * 100
    const val = node.value ?? 50
    switch (node.op) {
      case '<': return pct < val
      case '<=': return pct <= val
      case '>': return pct > val
      case '>=': return pct >= val
      case '==': return Math.abs(pct - val) < 0.1
      default: return true
    }
  }
  if (node.check === 'hasStatus') {
    const has = char.statuses.some(s => s.id === node.statusId)
    return node.op === 'not' ? !has : has
  }
  if (node.check === 'diceRoll') {
    const roll = Math.floor(Math.random() * 20) + 1
    context.lastRoll = roll
    const val = node.value ?? 10
    switch (node.op) {
      case '<': return roll < val
      case '<=': return roll <= val
      case '>': return roll > val
      case '>=': return roll >= val
      default: return true
    }
  }
  return true
}

function executeAction(
  charId: number, status: StatusInstance, node: StatusNode,
  actions: NodeActions, context: ExecutionContext
): void {
  if (node.action === 'damage') {
    const result = parseDiceExpression(node.formula || '1d6')
    actions.applyDamage(charId, result.total)
  } else if (node.action === 'heal') {
    const result = parseDiceExpression(node.formula || '1d8')
    actions.applyHeal(charId, result.total)
  } else if (node.action === 'applyStatus') {
    const defs = actions.getAllStatusDefs()
    const def = defs.find(s => s.id === node.statusId)
    if (def) {
      actions.addStatus(charId, {
        id: def.id, name: def.name, icon: def.icon, color: def.color,
        type: 'timed', duration: node.duration || 3, logic: def.logic,
      })
    }
  } else if (node.action === 'removeStatus') {
    if (node.statusId === 'self') actions.removeStatus(charId, status.uid)
    else actions.removeStatusById(charId, node.statusId || '')
  } else if (node.action === 'roll') {
    const result = parseDiceExpression(node.formula || '1d20')
    context.lastRoll = result.total
  }
}
EOF
ok "Движок узлов создан"

# ===== 5. Store каталогов =====
info "Создаю store каталогов..."
cat > src/stores/catalogStore.ts << 'EOF'
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
EOF
ok "Store каталогов создан"

# ===== 6. Store кубиков =====
info "Создаю store кубиков..."
cat > src/stores/diceStore.ts << 'EOF'
import { create } from 'zustand'
import type { ActiveRoll, TargetMode } from '@/types'
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
    const expr = '1d' + sides + (mod !== 0 ? (mod > 0 ? '+' + mod : String(mod)) : '')
    get().roll(expr)
  },

  setMode: (mode) => set(state => ({
    activeRoll: state.activeRoll
      ? { ...state.activeRoll, mode, aoeTargets: new Set() }
      : null,
  })),

  toggleDie: (dieId) => set(state => {
    if (!state.activeRoll) return state
    return {
      activeRoll: {
        ...state.activeRoll,
        dice: state.activeRoll.dice.map(d =>
          d.id === dieId && !d.spent ? { ...d, selected: !d.selected } : d
        ),
      },
    }
  }),

  clearRoll: () => set({ activeRoll: null }),

  clearSelection: () => set(state => {
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
    let posSum = 0, negSum = 0
    activeRoll.dice.filter(d => d.selected && !d.spent).forEach(d => {
      if (d.sign === '+') posSum += d.value
      else negSum += d.value
    })
    return posSum - negSum + activeRoll.modifier
  },

  setModifier: (mod) => set({ modifier: mod }),
}))
EOF
ok "Store кубиков создан"

# ===== 7. Store заклинаний =====
info "Создаю store заклинаний..."
cat > src/stores/spellStore.ts << 'EOF'
import { create } from 'zustand'
import type { SpellDefinition } from '@/types'
import { parseDiceExpression } from '@/utils/diceParser'
import { useCharacterStore } from '@/stores/characterStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { PERMANENT_STATUSES, TIMED_STATUSES } from '@/data/statusDefs'
import { STATUS_CATALOG } from '@/data/statuses'

interface CastResult { name: string; success: boolean | null; details: string }

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

  startCast: (spell) => set({
    activeSpell: spell, spellTargets: new Set(),
    lastSpellTarget: null, selecting: true, castLog: null,
  }),

  cancelCast: () => set({
    activeSpell: null, spellTargets: new Set(),
    lastSpellTarget: null, selecting: false, castLog: null,
  }),

  toggleTarget: (charId) => set(state => {
    const targets = new Set(state.spellTargets)
    if (targets.has(charId)) targets.delete(charId)
    else targets.add(charId)
    return { spellTargets: targets }
  }),

  setSingleTarget: (charId) => set({ lastSpellTarget: charId, selecting: false }),

  executeCast: (casterLevel = 5) => {
    const { activeSpell, spellTargets, lastSpellTarget } = get()
    if (!activeSpell) return
    const { characters, applyDamage, applyHeal, addStatus } = useCharacterStore.getState()
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
        results.push({ name: char.name, success, details: 'd20=' + saveRoll + ' (DC ' + dc + ')' })
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
          ...STATUS_CATALOG, ...useCatalogStore.getState().customStatuses,
          ...PERMANENT_STATUSES, ...TIMED_STATUSES,
        ]
        const def = allDefs.find(s => s.id === effect.statusId)
        if (def) {
          addStatus(charId, {
            id: def.id, name: def.name, icon: def.icon, color: def.color,
            type: 'timed', duration: effect.duration || 3,
          })
        }
      }
    }

    set({
      castLog: { spell: activeSpell, dc, results },
      activeSpell: null, spellTargets: new Set(),
      lastSpellTarget: null, selecting: false,
    })
    setTimeout(() => set({ castLog: null }), 4000)
  },
}))

function calculateDC(spell: SpellDefinition, casterLevel: number): number {
  if (!spell.logic.save) return 10
  const prof = Math.ceil(casterLevel / 4) + 1
  return 8 + prof + 3
}
EOF
ok "Store заклинаний создан"

# ===== 8. Обновление characterStore =====
info "Обновляю characterStore..."
cat > src/stores/characterStore.ts << 'EOF'
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

  addCharacter: (type, data) => set(state => ({
    characters: [...state.characters, {
      id: nextId++, type,
      name: data.name || 'Безымянный', cls: data.cls || '—',
      level: data.level || 1,
      hp: { current: data.hp?.current ?? 30, max: data.hp?.max ?? 30, temp: 0 },
      ac: data.ac || 10, initiative: data.initiative || 0,
      color: data.color || '#e94560',
      statuses: [], quickRolls: [],
      x: data.x || 100 + Math.random() * 300,
      y: data.y || 100 + Math.random() * 200,
    }],
  })),

  removeCharacter: (id) => set(s => ({ characters: s.characters.filter(c => c.id !== id) })),

  updateCharacter: (id, data) => set(s => ({
    characters: s.characters.map(c => c.id === id ? { ...c, ...data } : c),
  })),

  setPosition: (id, x, y) => set(s => ({
    characters: s.characters.map(c => c.id === id ? { ...c, x, y } : c),
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
        return { ...c, hp: { ...c.hp, temp, current: Math.max(0, c.hp.current - remaining) } }
      }),
    }))
    get().triggerEvent(id, 'takeDamage', { damage: amount })
  },

  applyHeal: (id, amount) => set(s => ({
    characters: s.characters.map(c => {
      if (c.id !== id || amount <= 0) return c
      return { ...c, hp: { ...c.hp, current: Math.min(c.hp.max, c.hp.current + amount) } }
    }),
  })),

  applyTempHp: (id, amount) => set(s => ({
    characters: s.characters.map(c => {
      if (c.id !== id || amount <= 0) return c
      return { ...c, hp: { ...c.hp, temp: c.hp.temp + amount } }
    }),
  })),

  setHp: (id, value) => set(s => ({
    characters: s.characters.map(c => c.id === id
      ? { ...c, hp: { ...c.hp, current: Math.min(c.hp.max, Math.max(0, value)) } }
      : c
    ),
  })),

  addStatus: (charId, status) => set(s => ({
    characters: s.characters.map(c => c.id === charId
      ? { ...c, statuses: [...c.statuses, { ...status, uid: statusUid++ }] }
      : c
    ),
  })),

  removeStatus: (charId, uid) => set(s => ({
    characters: s.characters.map(c => c.id === charId
      ? { ...c, statuses: c.statuses.filter(st => st.uid !== uid) }
      : c
    ),
  })),

  removeStatusById: (charId, statusId) => set(s => ({
    characters: s.characters.map(c => c.id === charId
      ? { ...c, statuses: c.statuses.filter(st => st.id !== statusId) }
      : c
    ),
  })),

  tickStatuses: (charId) => {
    const expired: StatusInstance[] = []
    set(state => ({
      characters: state.characters.map(c => {
        if (c.id !== charId) return c
        const remaining = c.statuses.filter(s => {
          if (s.type === 'timed' && s.duration !== null) {
            s.duration--
            if (s.duration <= 0) { expired.push(s); return false }
          }
          return true
        })
        return { ...c, statuses: remaining }
      }),
    }))
    return expired
  },

  addQuickRoll: (charId, roll) => set(s => ({
    characters: s.characters.map(c => c.id === charId
      ? { ...c, quickRolls: [...c.quickRolls, { ...roll, id: Date.now() }] }
      : c
    ),
  })),

  removeQuickRoll: (charId, rollId) => set(s => ({
    characters: s.characters.map(c => c.id === charId
      ? { ...c, quickRolls: c.quickRolls.filter(r => r.id !== rollId) }
      : c
    ),
  })),

  triggerEvent: (charId, event, context = {}) => {
    const store = get()
    const allDefs = [
      ...STATUS_CATALOG, ...useCatalogStore.getState().customStatuses,
      ...PERMANENT_STATUSES, ...TIMED_STATUSES,
    ]
    executeStatusTriggers(charId, event, {
      applyDamage: store.applyDamage,
      applyHeal: store.applyHeal,
      addStatus: store.addStatus,
      removeStatus: store.removeStatus,
      removeStatusById: store.removeStatusById,
      getCharacter: (id) => get().characters.find(c => c.id === id),
      getAllStatusDefs: () => allDefs,
    }, context)
  },
}))
EOF
ok "CharacterStore обновлён"

# ===== 9. Обновление combatStore =====
info "Обновляю combatStore..."
cat > src/stores/combatStore.ts << 'EOF'
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
    set({ active: true, turnOrder: withInit.map(w => w.id), currentTurnIndex: 0, round: 1 })
    useCharacterStore.getState().triggerEvent(withInit[0].id, 'turnStart')
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
    set({ currentTurnIndex, round, turnOrder })
    useCharacterStore.getState().triggerEvent(turnOrder[currentTurnIndex], 'turnStart')
  },

  resetCombat: () => {
    const { characters, updateCharacter } = useCharacterStore.getState()
    characters.forEach(c => updateCharacter(c.id, { initiative: 0 }))
    set({ active: false, turnOrder: [], currentTurnIndex: -1, round: 1 })
  },
}))
EOF
ok "CombatStore обновлён"

# ===== 10. Store уведомлений =====
info "Создаю store уведомлений..."
cat > src/stores/toastStore.ts << 'EOF'
import { create } from 'zustand'

interface Toast { id: number; message: string }

interface ToastStore {
  toasts: Toast[]
  showToast: (message: string) => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message) => {
    const id = ++toastId
    set(state => ({ toasts: [...state.toasts, { id, message }] }))
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}))
EOF
ok "Store уведомлений создан"

# ===== Финал =====
info "Проверяю TypeScript..."
npx tsc --noEmit 2>&1 | head -5 || true

git add -A
git commit -m "feat: step 1 — data catalogs, node executor, stores" --allow-empty

echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ЭТАП 1/4 ЗАВЕРШЁН${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo "  Создано:"
echo "  📁 src/data/spells.ts         — 6 заклинаний"
echo "  📁 src/data/statuses.ts       — 3 статуса с логикой"
echo "  📁 src/data/statusDefs.ts     — 29 базовых статусов"
echo "  📁 src/utils/nodeExecutor.ts  — движок узлов"
echo "  📁 src/stores/diceStore.ts    — кубики"
echo "  📁 src/stores/spellStore.ts   — кастование заклинаний"
echo "  📁 src/stores/catalogStore.ts — каталоги + localStorage"
echo "  📁 src/stores/characterStore.ts — персонажи (обновлён)"
echo "  📁 src/stores/combatStore.ts  — бой (обновлён)"
echo "  📁 src/stores/toastStore.ts   — уведомления"
echo ""
echo -e "  Далее: ${CYAN}Этап 2 — компоненты персонажей и кубиков${NC}"
echo ""
