// Types for the D&D Encounter Builder

export interface Character {
  id: number;
  name: string;
  type: 'pc' | 'npc';
  cls: string;
  level: number;
  hpMax: number;
  hpCur: number;
  tempHp: number;
  ac: number;
  init: number;
  color: string;
  x: number;
  y: number;
  statuses: StatusEffect[];
  quickRolls: QuickRoll[];
}

export interface StatusDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'permanent' | 'timed';
  description?: string;
  logic?: StatusLogic;
}

export interface StatusEffect {
  uid: number;
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'permanent' | 'timed';
  duration?: number;
  logic?: StatusLogic;
}

export interface StatusLogic {
  nodes: StatusNode[];
}

export interface StatusNode {
  id: number;
  type: 'trigger' | 'condition' | 'action' | 'custom';
  event?: string;
  check?: string;
  op?: string;
  value?: number;
  statusId?: string;
  action?: string;
  formula?: string;
  damageType?: string;
  duration?: number;
  parentId?: number;
  label?: string;
}

export interface QuickRoll {
  id: number;
  name: string;
  formula: string;
}

export interface DiceRoll {
  id: number;
  expression: string;
  total: number;
  timestamp: Date;
}

export interface DieResult {
  id: number;
  sides: number;
  value: number;
  sign?: '+' | '-';
  selected: boolean;
  spent: boolean;
  dropped: boolean;
}

export interface ActiveRoll {
  expression: string;
  dice: DieResult[];
  modifier: number;
  mode: 'single' | 'aoe' | 'spread';
  aoeTargets: Set<number>;
  animating: boolean;
  parseResult?: ParsedDiceResult;
}

export interface ParsedDiceResult {
  total: number;
  dice: DieResult[];
  modifier: number;
  expression: string;
}

export interface Spell {
  id: string;
  name: string;
  icon: string;
  description: string;
  level: number;
  school: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  classes?: string[];
  logic: SpellLogic;
}

export interface SpellLogic {
  targetMode: 'single' | 'aoe' | 'spread';
  selfOnly?: boolean;
  save?: {
    ability: string;
    dcFormula: string;
  } | null;
  onFail?: SpellEffect | null;
  onSuccess?: SpellEffect | null;
}

export interface SpellEffect {
  type: 'damage' | 'heal' | 'applyStatus' | 'removeStatus';
  formula?: string;
  damageType?: string;
  statusId?: string;
  duration?: number;
  count?: number;
  acBonus?: number;
}

export interface SavedRoll {
  id: number;
  label?: string;
  formula: string;
}

export interface StatusWizard {
  id?: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  nodes: StatusNode[];
}

export interface SpellWizard extends Spell {}

export interface AppState {
  // Characters
  characters: Character[];
  nextId: number;
  
  // Combat
  combatActive: boolean;
  turnOrder: number[]; // character IDs
  currentTurnIndex: number;
  round: number;
  
  // Dice
  diceHistory: string[];
  savedRolls: SavedRoll[];
  nextRollId: number;
  activeRoll: ActiveRoll | null;
  
  // Catalogs
  customStatuses: StatusDef[];
  customSpells: Spell[];
  
  // UI State
  popupTargetId: number | null;
  lastTargetId: number | null;
  selectedStatusTab: 'permanent' | 'timed';
}
