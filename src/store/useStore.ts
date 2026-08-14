import { create } from 'zustand';
import type { Character, ActiveRoll, ParsedDiceResult, SavedRoll, Spell, StatusEffect } from '../types';

const COLORS = ['#e94560','#3a86ff','#4ecca3','#f5a623','#8338ec','#ff6b6b','#48dbfb','#ff9ff3','#54a0ff','#5f27cd','#01a3a4','#f368e0'];

// Default status definitions
const STATUS_DEFS = {
  permanent: [
    { id: 'prone', name: 'Прон', icon: '🛌', color: '#8892a4' },
    { id: 'restrained', name: 'Скован', icon: '⛓️', color: '#8338ec' },
    { id: 'invisible', name: 'Невидим', icon: '👻', color: '#48dbfb' },
    { id: 'concentrating', name: 'Концентрация', icon: '🧠', color: '#d4a843' },
  ],
  timed: [
    { id: 'poisoned', name: 'Отравлен', icon: '☠️', color: '#4ecca3' },
    { id: 'stunned', name: 'Оглушен', icon: '💫', color: '#f5a623' },
    { id: 'paralyzed', name: 'Парализован', icon: '⚡', color: '#3a86ff' },
    { id: 'frightened', name: 'Напуган', icon: '😱', color: '#8338ec' },
    { id: 'blinded', name: 'Ослеплен', icon: '🙈', color: '#8892a4' },
    { id: 'deafened', name: 'Оглох', icon: '🙉', color: '#8892a4' },
    { id: 'grappled', name: 'Схвачен', icon: '🤼', color: '#e94560' },
    { id: 'banished', name: 'Изгнан', icon: '🌀', color: '#8338ec' },
    { id: 'petrified', name: 'Окаменел', icon: '🗿', color: '#8892a4' },
  ],
};

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
  customStatuses: StatusEffect[];
  customSpells: Spell[];
  popupTargetId: number | null;
  lastTargetId: number | null;
  selectedStatusTab: 'permanent' | 'timed' | 'custom';
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
  decrementStatusDurations: () => void;
  addQuickRoll: (charId: number, roll: { label: string; formula: string }) => void;
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
  addCustomStatus: (status: StatusEffect) => void;
  removeCustomStatus: (id: string) => void;
  addCustomSpell: (spell: Spell) => void;
  removeCustomSpell: (id: string) => void;
  setPopupTargetId: (id: number | null) => void;
  setLastTargetId: (id: number | null) => void;
  setSelectedStatusTab: (tab: 'permanent' | 'timed' | 'custom') => void;
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
      if (c.hpTemp > 0) {
        if (c.hpTemp >= remaining) {
          absorbed = remaining;
          remaining = 0;
        } else {
          absorbed = c.hpTemp;
          remaining -= absorbed;
        }
      }
      const newHpTemp = Math.max(0, c.hpTemp - absorbed);
      const newHpCur = Math.max(0, c.hpCur - remaining);
      const isDead = newHpCur <= 0;
      return { ...c, hpCur: newHpCur, hpTemp: newHpTemp, isDead };
    }),
  })),
  
  applyHeal: (id, amount) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === id ? { ...c, hpCur: Math.min(c.hpMax, c.hpCur + amount) } : c
    ),
  })),
  
  applyTempHP: (id, amount) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === id ? { ...c, hpTemp: Math.max(c.hpTemp, amount) } : c
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
  
  decrementStatusDurations: () => set((state) => ({
    characters: state.characters.map((c) => ({
      ...c,
      statuses: c.statuses
        .map((s) => ({
          ...s,
          duration: s.type === 'timed' && s.duration ? s.duration - 1 : s.duration,
        }))
        .filter((s) => s.type !== 'timed' || !s.duration || s.duration > 0),
    })),
  })),
  
  addQuickRoll: (charId, roll) => set((state) => ({
    characters: state.characters.map((c) => 
      c.id === charId ? { ...c, quickRolls: [...c.quickRolls, { ...roll, id: Date.now() }] } : c
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
    const sorted = [...state.characters].sort((a, b) => b.initiative - a.initiative);
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
    return { activeRoll: { ...state.activeRoll, mode } };
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
}));

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
