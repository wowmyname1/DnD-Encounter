// Types for the D&D Encounter Builder

export interface Character {
  id: number;
  name: string;
  type: 'pc' | 'npc';
  classType: string;
  level: number;
  hpMax: number;
  hpCur: number;
  hpTemp: number;
  ac: number;
  initiative: number;
  color: string;
  x: number;
  y: number;
  statuses: StatusEffect[];
  quickRolls: QuickRoll[];
  isDead: boolean;
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
  triggers?: string[];
  conditions?: Condition[];
  actions?: Action[];
}

export interface Condition {
  check: string;
  op?: string;
  value?: number;
  statusId?: string;
  formula?: string;
}

export interface Action {
  action: string;
  formula?: string;
  statusId?: string;
  duration?: number;
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
  sign: string;
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
  logic: SpellLogic;
}

export interface SpellLogic {
  targetMode: 'single' | 'aoe' | 'spread';
  save?: string;
  onSuccess?: SpellEffect;
  onFail?: SpellEffect;
}

export interface SpellEffect {
  type: 'damage' | 'heal' | 'applyStatus';
  formula?: string;
  statusId?: string;
  duration?: number;
}

export interface SavedRoll {
  id: number;
  formula: string;
}

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
  
  // Status effects
  customStatuses: StatusEffect[];
  customSpells: Spell[];
  
  // UI State
  popupTargetId: number | null;
  lastTargetId: number | null;
  selectedStatusTab: 'permanent' | 'timed' | 'custom';
}
