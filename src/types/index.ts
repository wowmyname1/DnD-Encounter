// ===== Персонажи =====

export type CharacterType = 'pc' | 'npc'

export interface HpState {
  current: number
  max: number
  temp: number
}

export interface Character {
  id: number
  type: CharacterType
  name: string
  cls: string
  level: number
  hp: HpState
  ac: number
  initiative: number
  color: string
  statuses: StatusInstance[]
  quickRolls: QuickRoll[]
  x: number
  y: number
}

export interface QuickRoll {
  id: number
  name: string
  formula: string
}

// ===== Статусы =====

export type StatusType = 'permanent' | 'timed'

export interface StatusInstance {
  uid: number
  id: string
  name: string
  icon: string
  color: string
  type: StatusType
  duration: number | null
  logic?: StatusLogic
}

export interface StatusDefinition {
  id: string
  name: string
  icon: string
  color: string
  description?: string
  logic?: StatusLogic
}

// ===== Узловая система =====

export type NodeEventType =
  | 'turnStart'
  | 'turnEnd'
  | 'takeDamage'
  | 'dealDamage'
  | 'manual'

export type NodeType = 'trigger' | 'condition' | 'action'

export interface StatusNode {
  id: number
  type: NodeType
  parentId: number | null
  // Trigger
  event?: NodeEventType
  // Condition
  check?: 'hpPercent' | 'hasStatus' | 'diceRoll'
  op?: '<' | '<=' | '>' | '>=' | '==' | 'not'
  value?: number
  statusId?: string
  // Action
  action?: 'damage' | 'heal' | 'applyStatus' | 'removeStatus' | 'roll'
  formula?: string
  damageType?: string
  duration?: number
}

export interface StatusLogic {
  nodes: StatusNode[]
}

// ===== Заклинания =====

export type TargetMode = 'single' | 'aoe' | 'spread'

export interface SpellEffect {
  type: 'damage' | 'heal' | 'applyStatus' | 'removeStatus'
  formula?: string
  damageType?: string
  statusId?: string
  duration?: number
}

export interface SpellLogic {
  targetMode: TargetMode
  save: {
    ability: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
    dcFormula: string
  } | null
  onFail: SpellEffect | null
  onSuccess: SpellEffect | null
}

export interface SpellDefinition {
  id: string
  name: string
  level: number
  school: string
  icon: string
  castingTime: string
  range: string
  duration: string
  classes: string[]
  description: string
  logic: SpellLogic
}

// ===== Бой =====

export interface CombatState {
  active: boolean
  turnOrder: number[]
  currentTurnIndex: number
  round: number
}

// ===== Кубики =====

export interface Die {
  id: number
  value: number
  sides: number
  selected: boolean
  spent: boolean
  dropped: boolean
  sign: '+' | '-'
}

export interface ActiveRoll {
  expression: string
  dice: Die[]
  modifier: number
  mode: TargetMode
  aoeTargets: Set<number>
}
