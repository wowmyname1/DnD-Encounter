import { create } from 'zustand';
import type { Character, ActiveRoll, ParsedDiceResult, SavedRoll, Spell, StatusEffect, StatusDef, QuickRoll, StatusNode, StatusWizard, SpellWizard } from '../types';

export const COLORS = ['#e94560','#3a86ff','#4ecca3','#f5a623','#8338ec','#ff6b6b','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#f368e0'];

// Default status definitions from prototype
export const STATUS_DEFS = {
  permanent: [
    { id: 'prone', name: 'Распластан', icon: '🫎', color: '#8892a4' },
    { id: 'restrained', name: 'Опутан', icon: '⛓️', color: '#8338ec' },
    { id: 'invisible', name: 'Невидим', icon: '👻', color: '#48dbfb' },
    { id: 'concentrating', name: 'Концентрация', icon: '🧠', color: '#d4a843' },
  ],
  timed: [
    { id: 'poisoned', name: 'Отравлен', icon: '☠️', color: '#4ecca3' },
    { id: 'stunned', name: 'Ошеломлен', icon: '💫', color: '#f5a623' },
    { id: 'paralyzed', name: 'Парализован', icon: '🗿', color: '#8892a4' },
    { id: 'frightened', name: 'Напуган', icon: '😱', color: '#ff6b6b' },
    { id: 'charmed', name: 'Очарован', icon: '💖', color: '#ff9ff3' },
    { id: 'blinded', name: 'Ослеплен', icon: '🙈', color: '#8892a4' },
    { id: 'deafened', name: 'Оглушен', icon: '🙉', color: '#8892a4' },
    { id: 'exhaustion', name: 'Истощение', icon: '😫', color: '#e94560' },
  ]
};

// Default spell catalog from prototype
export const SPELL_CATALOG = [
  { id: 'firebolt', name: 'Огненный снаряд', level: 0, school: 'Evocation', icon: '🔥', castingTime: '1 действие', range: '120 футов', duration: 'Мгновенно', description: 'Атака заклинанием дальнего боя.', logic: { targetMode: 'single', save: null, onFail: null, onSuccess: null } },
  { id: 'magicmissile', name: 'Волшебная стрела', level: 1, school: 'Evocation', icon: '✨', castingTime: '1 действие', range: '120 футов', duration: 'Мгновенно', description: 'Создает три светящихся дротика.', logic: { targetMode: 'spread', save: null, onFail: null, onSuccess: null } },
  { id: 'burninghands', name: 'Обжигающие руки', level: 1, school: 'Evocation', icon: '🔥', castingTime: '1 действие', range: '15 футов', duration: 'Мгновенно', description: 'Урон огнем в конусе.', logic: { targetMode: 'aoe', save: { ability: 'DEX', dcFormula: '8+prof+mod' }, onFail: { type: 'damage', formula: '3d6', damageType: 'fire' }, onSuccess: { type: 'damage', formula: '3d6/2', damageType: 'fire' } } },
  { id: 'sleep', name: 'Сон', level: 1, school: 'Enchantment', icon: '💤', castingTime: '1 действие', range: '90 футов', duration: '1 минута', description: 'Усыпляет существ в области.', logic: { targetMode: 'aoe', save: null, onFail: { type: 'applyStatus', statusId: 'unconscious', duration: 5 }, onSuccess: null } },
  { id: 'healingword', name: 'Целительное слово', level: 1, school: 'Evocation', icon: '💚', castingTime: 'Бонусное действие', range: '60 футов', duration: 'Мгновенно', description: 'Лечит существо.', logic: { targetMode: 'single', save: null, onFail: { type: 'heal', formula: '1d4+mod' }, onSuccess: null } },
  { id: 'thunderwave', name: 'Громовая волна', level: 1, school: 'Evocation', icon: '🌊', castingTime: '1 действие', range: '15 футов', duration: 'Мгновенно', description: 'Урон звуком и отталкивание.', logic: { targetMode: 'aoe', save: { ability: 'CON', dcFormula: '8+prof+mod' }, onFail: { type: 'damage', formula: '3d8', damageType: 'thunder' }, onSuccess: { type: 'damage', formula: '3d8/2', damageType: 'thunder' } } },
  { id: 'guidingbolt', name: 'Направляющий луч', level: 1, school: 'Evocation', icon: '⭐', castingTime: '1 действие', range: '120 футов', duration: '1 раунд', description: 'Луч света дает преимущество следующей атаке.', logic: { targetMode: 'single', save: null, onFail: { type: 'damage', formula: '4d6', damageType: 'radiant' }, onSuccess: null } },
  { id: 'dissonantwhispers', name: 'Диссонирующий шёпот', level: 1, school: 'Enchantment', icon: '👂', castingTime: '1 действие', range: '60 футов', duration: 'Мгновенно', description: 'Психический урон и реакция.', logic: { targetMode: 'single', save: { ability: 'WIS', dcFormula: '8+prof+mod' }, onFail: { type: 'damage', formula: '3d6', damageType: 'psychic' }, onSuccess: { type: 'damage', formula: '3d6/2', damageType: 'psychic' } } },
];

interface StoreState {
  characters: Character[];
  nextId: number;
  combatActive: boolean;
  turnOrder: number[];
  currentTurnIndex: number;
  round: number;
  diceHistory: string[];
  savedRolls: SavedRoll[];
  nextRollId: number;
  activeRoll: ActiveRoll | null;
  customStatuses: StatusDef[];
  customSpells: Spell[];
  popupTargetId: number | null;
  lastTargetId: number | null;
  selectedStatusTab: 'permanent' | 'timed';
  statusUidCounter: number;
  activeSpell: { spell: Spell; targets: Set<number>; selecting: boolean } | null;
  lastSpellTarget: number | null;
  statusWizard: StatusWizard | null;
  spellWizard: SpellWizard | null;
}

interface StoreActions {
  addCharacter: (char: Omit<Character, 'id'>) => void;
  updateCharacter: (id: number, updates: Partial<Character>) => void;
  removeCharacter: (id: number) => void;
  applyDamage: (id: number, amount: number) => void;
  applyHeal: (id: number, amount: number) => void;
  applyTempHP: (id: number, amount: number) => void;
  addStatus: (charId: number, status: StatusEffect) => void;
  removeStatus: (charId: number, statusUid: number) => void;
  decrementStatusDurations: (charId?: number) => void;
  addQuickRoll: (charId: number, roll: QuickRoll) => void;
  removeQuickRoll: (charId: number, rollId: number) => void;
  toggleCombat: () => void;
  initCombat: () => void;
  nextTurn: () => void;
  prevTurn: () => void;
  resetCombat: () => void;
  setActiveRoll: (parseResult: ParsedDiceResult) => void;
  clearActiveRoll: () => void;
  clearSelection: () => void;
  toggleDie: (dieId: number) => void;
  setRollMode: (mode: 'single' | 'aoe' | 'spread') => void;
  addToDiceHistory: (entry: string) => void;
  saveRoll: (label: string, expression: string) => void;
  deleteSavedRoll: (id: number) => void;
  addCustomStatus: (status: StatusDef) => void;
  removeCustomStatus: (id: string) => void;
  addCustomSpell: (spell: Spell) => void;
  removeCustomSpell: (id: string) => void;
  setPopupTargetId: (id: number | null) => void;
  setLastTargetId: (id: number | null) => void;
  setSelectedStatusTab: (tab: 'permanent' | 'timed') => void;
  incrementStatusUid: () => number;
  setActiveSpell: (spell: Spell) => void;
  cancelSpellCast: () => void;
  setSpellTarget: (charId: number, mode: 'single' | 'aoe' | 'spread') => void;
  executeSpell: () => void;
  setStatusWizard: (wizard: StatusWizard | null) => void;
  setSpellWizard: (wizard: SpellWizard | null) => void;
  executeStatusTriggers: (charId: number, event: string, context?: any) => void;
}

type Store = StoreState & StoreActions;

export const useStore = create<Store>((set, get) => ({
  characters: [],
  nextId: 1,
  combatActive: false,
  turnOrder: [],
  currentTurnIndex: -1,
  round: 1,
  diceHistory: [],
  savedRolls: [],
  nextRollId: 1,
  activeRoll: null,
  customStatuses: [],
  customSpells: [],
  popupTargetId: null,
  lastTargetId: null,
  selectedStatusTab: 'permanent',
  statusUidCounter: 1,
  
  addCharacter: (char) => set((state) => ({
    characters: [...state.characters, { ...char, id: state.nextId }],
    nextId: state.nextId + 1,
  })),
  
  updateCharacter: (id, updates) => set((state) => ({
    characters: state.characters.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  
  removeCharacter: (id) => set((state) => ({
    characters: state.characters.filter((c) => c.id !== id),
    turnOrder: state.turnOrder.filter((tid) => tid !== id),
  })),
  
  applyDamage: (id, amount) => set((state) => ({
    characters: state.characters.map((c) => {
      if (c.id !== id) return c;
      let remaining = amount;
      let absorbed = 0;
      if (c.tempHp > 0) {
        absorbed = Math.min(c.tempHp, remaining);
        remaining -= absorbed;
      }
      const newHpTemp = Math.max(0, c.tempHp - absorbed);
      const newHpCur = Math.max(0, c.hpCur - remaining);
      return { ...c, hpCur: newHpCur, tempHp: newHpTemp };
    }),
  })),
  
  applyHeal: (id, amount) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === id ? { ...c, hpCur: Math.min(c.hpMax, c.hpCur + amount) } : c
    ),
  })),
  
  applyTempHP: (id, amount) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === id ? { ...c, tempHp: Math.max(c.tempHp, amount) } : c
    ),
  })),
  
  addStatus: (charId, status) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === charId ? { ...c, statuses: [...c.statuses, status] } : c
    ),
  })),
  
  removeStatus: (charId, statusUid) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === charId ? { ...c, statuses: c.statuses.filter((s) => s.uid !== statusUid) } : c
    ),
  })),
  
  decrementStatusDurations: (charId) => set((state) => ({
    characters: state.characters.map((c) => {
      if (charId && c.id !== charId) return c;
      return {
        ...c,
        statuses: c.statuses
          .map((s) => ({
            ...s,
            duration: s.type === 'timed' && s.duration ? s.duration - 1 : s.duration,
          }))
          .filter((s) => s.type !== 'timed' || !s.duration || s.duration > 0),
      };
    }),
  })),
  
  addQuickRoll: (charId, roll) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === charId ? { ...c, quickRolls: [...c.quickRolls, roll] } : c
    ),
  })),
  
  removeQuickRoll: (charId, rollId) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === charId ? { ...c, quickRolls: c.quickRolls.filter((qr) => qr.id !== rollId) } : c
    ),
  })),
  
  toggleCombat: () => {
    const { combatActive } = get();
    if (!combatActive) {
      get().initCombat();
    } else {
      set({ combatActive: false });
    }
  },
  
  initCombat: () => set((state) => {
    const alive = state.characters.filter(c => c.hpCur > 0);
    // Roll initiative for those without it
    const withInit = alive.map(c => {
      if (c.init === 0) {
        return { ...c, init: Math.floor(Math.random() * 20) + 1 };
      }
      return c;
    });
    // Update characters with rolled initiatives
    set({ characters: withInit });
    
    const sorted = [...withInit].sort((a, b) => b.init - a.init);
    return {
      combatActive: true,
      turnOrder: sorted.map((c) => c.id),
      currentTurnIndex: 0,
      round: 1,
    };
  }),
  
  nextTurn: () => set((state) => {
    if (!state.combatActive || state.turnOrder.length === 0) return state;
    const currentCharId = state.turnOrder[state.currentTurnIndex];
    // Decrement statuses for current character
    if (currentCharId) {
      const chars = state.characters.map((c) => {
        if (c.id !== currentCharId) return c;
        return {
          ...c,
          statuses: c.statuses
            .map((s) => ({
              ...s,
              duration: s.type === 'timed' && s.duration ? s.duration - 1 : s.duration,
            }))
            .filter((s) => s.type !== 'timed' || !s.duration || s.duration > 0),
        };
      });
      set({ characters: chars });
    }
    let newIndex = state.currentTurnIndex + 1;
    let newRound = state.round;
    if (newIndex >= state.turnOrder.length) {
      newIndex = 0;
      newRound++;
      // Filter out dead characters at round start
      const aliveTurnOrder = state.turnOrder.filter(id => {
        const char = state.characters.find(c => c.id === id);
        return char && char.hpCur > 0;
      });
      if (aliveTurnOrder.length === 0) {
        return { ...state, combatActive: false, turnOrder: [], currentTurnIndex: -1, round: 1 };
      }
      return { turnOrder: aliveTurnOrder, currentTurnIndex: newIndex, round: newRound };
    }
    return { currentTurnIndex: newIndex, round: newRound };
  }),
  
  prevTurn: () => set((state) => {
    if (!state.combatActive || state.turnOrder.length === 0) return state;
    let newIndex = state.currentTurnIndex - 1;
    let newRound = state.round;
    if (newIndex < 0) {
      newIndex = state.turnOrder.length - 1;
      newRound = Math.max(1, state.round - 1);
    }
    return { currentTurnIndex: newIndex, round: newRound };
  }),
  
  resetCombat: () => set({ combatActive: false, turnOrder: [], currentTurnIndex: -1, round: 1 }),
  setActiveRoll: (parseResult) => set({ activeRoll: { parseResult, mode: 'single', aoeTargets: new Set(), animating: true } }),
  clearActiveRoll: () => set({ activeRoll: null, popupTargetId: null }),
  clearSelection: () => set((state) => {
    if (!state.activeRoll) return {};
    return {
      activeRoll: {
        ...state.activeRoll,
        parseResult: {
          ...state.activeRoll.parseResult,
          dice: state.activeRoll.parseResult.dice.map((d) => ({ ...d, selected: false })),
        },
      },
    };
  }),
  toggleDie: (dieId) => set((state) => {
    if (!state.activeRoll) return {};
    return {
      activeRoll: {
        ...state.activeRoll,
        parseResult: {
          ...state.activeRoll.parseResult,
          dice: state.activeRoll.parseResult.dice.map((d) => d.id === dieId ? { ...d, selected: !d.selected } : d),
        },
      },
    };
  }),
  setRollMode: (mode) => set((state) => {
    if (!state.activeRoll) return {};
    return { activeRoll: { ...state.activeRoll, mode, aoeTargets: new Set() } };
  }),
  addToDiceHistory: (entry) => set((state) => ({ diceHistory: [entry, ...state.diceHistory].slice(0, 20) })),
  saveRoll: (label, expression) => set((state) => ({
    savedRolls: [...state.savedRolls, { id: state.nextRollId, label, expression }],
    nextRollId: state.nextRollId + 1,
  })),
  deleteSavedRoll: (id) => set((state) => ({ savedRolls: state.savedRolls.filter((r) => r.id !== id) })),
  addCustomStatus: (status) => set((state) => ({ customStatuses: [...state.customStatuses, status] })),
  removeCustomStatus: (id) => set((state) => ({ customStatuses: state.customStatuses.filter((s) => s.id !== id) })),
  addCustomSpell: (spell) => set((state) => ({ customSpells: [...state.customSpells, spell] })),
  removeCustomSpell: (id) => set((state) => ({ customSpells: state.customSpells.filter((s) => s.id !== id) })),
  setPopupTargetId: (id) => set({ popupTargetId: id }),
  setLastTargetId: (id) => set({ lastTargetId: id }),
  setSelectedStatusTab: (tab) => set({ selectedStatusTab: tab }),
  incrementStatusUid: () => set((state) => ({ statusUidCounter: state.statusUidCounter + 1 })) || get().statusUidCounter,
  
  // Spell casting actions
  setActiveSpell: (spell) => set({ activeSpell: { spell, targets: new Set(), selecting: true }, lastSpellTarget: null }),
  cancelSpellCast: () => set({ activeSpell: null, lastSpellTarget: null }),
  setSpellTarget: (charId, mode) => set((state) => {
    if (!state.activeSpell) return {};
    const { targets } = state.activeSpell;
    if (mode === 'single') {
      return { lastSpellTarget: charId };
    } else {
      const newTargets = new Set(targets);
      if (newTargets.has(charId)) {
        newTargets.delete(charId);
      } else {
        newTargets.add(charId);
      }
      return { activeSpell: { ...state.activeSpell, targets: newTargets } };
    }
  }),
  executeSpell: () => {
    const state = get();
    if (!state.activeSpell) return;
    const { spell, targets } = state.activeSpell;
    const caster = state.combatActive && state.turnOrder[state.currentTurnIndex] 
      ? state.characters.find(c => c.id === state.turnOrder[state.currentTurnIndex]) 
      : null;
    
    // Calculate DC
    let dc = 10;
    if (spell.logic.save && caster) {
      const prof = Math.ceil((caster.level || 1) / 4) + 2;
      const mod = 3; // Simplified ability modifier
      dc = 8 + prof + mod;
    }
    
    // Determine targets list
    let targetIds: number[] = [];
    if (spell.logic.targetMode === 'single') {
      if (state.lastSpellTarget) targetIds = [state.lastSpellTarget];
    } else {
      targetIds = Array.from(targets);
    }
    
    if (targetIds.length === 0) return;
    
    // Apply effects to each target
    targetIds.forEach(charId => {
      const char = state.characters.find(c => c.id === charId);
      if (!char) return;
      
      let success = true;
      if (spell.logic.save) {
        const saveRoll = Math.floor(Math.random() * 20) + 1;
        success = saveRoll >= dc;
      }
      
      const effectKey = success ? 'onSuccess' : 'onFail';
      const effect = spell.logic[effectKey];
      if (effect) {
        if (effect.type === 'damage') {
          let formula = effect.formula || '1d6';
          if (!success && formula.includes('d')) {
            // Half damage on success - divide dice count
            formula = formula.replace(/(\d+)d/, (m, n) => Math.max(1, Math.ceil(parseInt(n) / 2)) + 'd');
          }
          const result = parseDiceExpression(formula);
          get().applyDamage(charId, result.total);
        } else if (effect.type === 'heal') {
          const result = parseDiceExpression(effect.formula || '1d8');
          get().applyHeal(charId, result.total);
        } else if (effect.type === 'applyStatus') {
          const statusDef = [...STATUS_DEFS.permanent, ...STATUS_DEFS.timed, ...state.customStatuses].find(s => s.id === effect.statusId);
          if (statusDef) {
            const newStatus: StatusEffect = {
              uid: state.statusUidCounter,
              id: statusDef.id,
              name: statusDef.name,
              icon: statusDef.icon,
              color: statusDef.color,
              type: 'timed',
              duration: effect.duration || 3,
              logic: statusDef.logic,
            };
            get().addStatus(charId, newStatus);
          }
        }
      }
    });
    
    set({ activeSpell: null, lastSpellTarget: null });
  },
  
  // Wizard actions
  setStatusWizard: (wizard) => set({ statusWizard: wizard }),
  setSpellWizard: (wizard) => set({ spellWizard: wizard }),
  
  // Status trigger execution
  executeStatusTriggers: (charId, event, context = {}) => {
    const state = get();
    const character = state.characters.find(c => c.id === charId);
    if (!character) return;
    
    character.statuses.forEach(status => {
      if (!status.logic?.nodes) return;
      
      const triggers = status.logic.nodes.filter(n => n.type === 'trigger' && n.event === event);
      triggers.forEach(trigger => {
        executeNode(state, charId, status, trigger.id, context);
      });
    });
  },
}));

// Helper function to execute node tree
function executeNode(state: any, charId: number, status: StatusEffect, nodeId: number, context: any, depth: number = 0) {
  if (depth > 20) return;
  
  const character = state.characters.find((c: Character) => c.id === charId);
  if (!character) return;
  
  const node = status.logic?.nodes.find(n => n.id === nodeId);
  if (!node) return;
  
  let shouldContinue = true;
  
  if (node.type === 'condition') {
    shouldContinue = evaluateCondition(character, node, context);
  } else if (node.type === 'action') {
    executeAction(state, charId, status, node, context);
  }
  
  if (shouldContinue) {
    const children = status.logic?.nodes.filter(n => n.parentId === nodeId) || [];
    children.forEach(child => executeNode(state, charId, status, child.id, context, depth + 1));
  }
}

function evaluateCondition(character: Character, node: StatusNode, context: any): boolean {
  if (node.check === 'hpPercent') {
    const pct = (character.hpCur / character.hpMax) * 100;
    switch(node.op) {
      case '<': return pct < (node.value || 50);
      case '<=': return pct <= (node.value || 50);
      case '>': return pct > (node.value || 50);
      case '>=': return pct >= (node.value || 50);
      case '==': return Math.abs(pct - (node.value || 50)) < 0.1;
    }
  }
  if (node.check === 'hasStatus') {
    const has = character.statuses.some(s => s.id === node.statusId);
    return node.op === 'not' ? !has : has;
  }
  if (node.check === 'diceRoll') {
    const roll = Math.floor(Math.random() * 20) + 1;
    context.lastRoll = roll;
    switch(node.op) {
      case '<': return roll < (node.value || 10);
      case '<=': return roll <= (node.value || 10);
      case '>': return roll > (node.value || 10);
      case '>=': return roll >= (node.value || 10);
    }
  }
  return true;
}

function executeAction(state: any, charId: number, status: StatusEffect, node: StatusNode, context: any) {
  if (node.action === 'damage') {
    const result = parseDiceExpression(node.formula || '1d6');
    state.applyDamage(charId, result.total);
  } else if (node.action === 'heal') {
    const result = parseDiceExpression(node.formula || '1d8');
    state.applyHeal(charId, result.total);
  } else if (node.action === 'applyStatus') {
    const statusDef = [...STATUS_DEFS.permanent, ...STATUS_DEFS.timed, ...state.customStatuses].find((s: StatusDef) => s.id === node.statusId);
    if (statusDef) {
      const newStatus: StatusEffect = {
        uid: state.statusUidCounter,
        id: statusDef.id,
        name: statusDef.name,
        icon: statusDef.icon,
        color: statusDef.color,
        type: 'timed',
        duration: node.duration || 3,
        logic: statusDef.logic,
      };
      state.addStatus(charId, newStatus);
    }
  } else if (node.action === 'removeStatus') {
    if (node.statusId === 'self') {
      state.removeStatus(charId, status.uid);
    } else {
      const character = state.characters.find((c: Character) => c.id === charId);
      if (character) {
        character.statuses = character.statuses.filter(s => s.id !== node.statusId);
      }
    }
  } else if (node.action === 'roll') {
    const result = parseDiceExpression(node.formula || '1d20');
    context.lastRoll = result.total;
  }
}

export function validateExpression(expr: string): { valid: boolean; error?: string } {
  const tokens: string[] = [];
  let current = '';
  let sign = '+';
  
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === ' ' || ch === '\t') continue;
    if (/[+\-]/.test(ch) && (i === 0 || /[\d\)]/.test(expr[i - 1]))) {
      if (current) {
        tokens.push(sign + current);
        current = '';
      }
      sign = ch;
      if (i === 0 && ch === '-') continue;
      if (i === 0 && ch === '+') continue;
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(sign + current);
  
  for (const t of tokens) {
    const raw = t.trim();
    const diceMatch = raw.match(/^(\d*)d(\d+)(kh|kl)?(\d*)$/);
    const num = diceMatch ? (diceMatch[1] ? parseInt(diceMatch[1]) : 1) : 0;
    const sides = diceMatch ? parseInt(diceMatch[2]) : 0;
    
    if (diceMatch) {
      if (sides < 2) return { valid: false, error: 'Костей со сторонами < 2 не существует' };
      if (num > 100) return { valid: false, error: 'Слишком много костей (макс. 100)' };
    } else if (!/^\d+$/.test(raw)) {
      return { valid: false, error: `Неверный токен: ${raw}` };
    }
  }
  return { valid: true };
}

export function parseDiceExpression(expr: string): ParsedDiceResult {
  const tokens: string[] = [];
  let current = '';
  let sign = '+';
  
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === ' ' || ch === '\t') continue;
    if (/[+\-]/.test(ch) && (i === 0 || /[\d\)]/.test(expr[i - 1]))) {
      if (current) {
        tokens.push(sign + current);
        current = '';
      }
      sign = ch;
      if (i === 0 && ch === '-') continue;
      if (i === 0 && ch === '+') continue;
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(sign + current);
  
  const results: { value: number; sides: number; kept: boolean; dropped: boolean }[] = [];
  let total = 0;
  let modifier = 0;
  
  for (const token of tokens) {
    const match = token.match(/^([+-]?)(\d*)d(\d+)(kh|kl)?(\d*)$/);
    if (match) {
      const signVal = match[1] === '-' ? -1 : 1;
      const num = parseInt(match[2]) || 1;
      const sides = parseInt(match[3]);
      const keepType = match[4];
      const keepCount = match[5] !== undefined && match[5] !== '' ? parseInt(match[5]) : num;
      
      const rolls = [];
      for (let i = 0; i < num; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push({ value: val, sides, kept: true, dropped: false });
      }
      
      let keptIndices = rolls.map((_, i) => i);
      if (keepType) {
        const indexed = rolls.map((r, i) => ({ ...r, i }));
        if (keepType === 'kh') {
          indexed.sort((a, b) => b.value - a.value);
        } else {
          indexed.sort((a, b) => a.value - b.value);
        }
        keptIndices = indexed.slice(0, keepCount).map((r) => r.i);
      }
      
      const keptSet = new Set(keptIndices);
      rolls.forEach((r, i) => {
        r.kept = keptSet.has(i);
        r.dropped = !r.kept;
      });
      
      const sum = rolls.filter((r) => r.kept).reduce((a, b) => a + b.value, 0);
      total += signVal * sum;
      results.push(...rolls);
    } else {
      const num = parseInt(token);
      modifier += num;
      total += num;
    }
  }
  
  const dice = results.map((r, i) => ({
    id: Date.now() + i,
    sides: r.sides,
    value: r.value,
    selected: r.kept,
    spent: false,
    dropped: r.dropped,
  }));
  
  return { total, dice, modifier, expression: expr };
}

export { COLORS, STATUS_DEFS };
