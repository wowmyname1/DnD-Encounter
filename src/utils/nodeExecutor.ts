import type { Character, StatusInstance, StatusNode, NodeEventType } from '@/types'
import { parseDiceExpression } from '@/utils/diceParser'

export interface ExecutionContext {
  damage?: number
  lastRoll?: number
}

interface NodeActions {
  applyDamage: (id: number, amount: number) => void
  applyHeal: (id: number, amount: number) => void
  addStatus: (charId: number, status: {
    id: string; name: string; icon: string; color: string;
    type: 'permanent' | 'timed'; duration: number | null;
    logic?: { nodes: StatusNode[] }
  }) => void
  removeStatus: (charId: number, uid: number) => void
  removeStatusById: (charId: number, statusId: string) => void
  getCharacter: (id: number) => Character | undefined
  getAllStatusDefs: () => Array<{ id: string; name: string; icon: string; color: string; logic?: { nodes: StatusNode[] } }>
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
  charId: number,
  status: StatusInstance,
  nodeId: number,
  actions: NodeActions,
  context: ExecutionContext,
  depth: number
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

function evaluateCondition(
  char: Character,
  node: StatusNode,
  context: ExecutionContext
): boolean {
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
  charId: number,
  status: StatusInstance,
  node: StatusNode,
  actions: NodeActions,
  context: ExecutionContext
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
        id: def.id,
        name: def.name,
        icon: def.icon,
        color: def.color,
        type: 'timed',
        duration: node.duration || 3,
        logic: def.logic,
      })
    }
  } else if (node.action === 'removeStatus') {
    if (node.statusId === 'self') {
      actions.removeStatus(charId, status.uid)
    } else {
      actions.removeStatusById(charId, node.statusId || '')
    }
  } else if (node.action === 'roll') {
    const result = parseDiceExpression(node.formula || '1d20')
    context.lastRoll = result.total
  }
}
